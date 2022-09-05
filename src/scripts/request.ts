import { FDStateInfo } from '../state'
import { InitCallback, MonitorDataRecod } from "../shared/definition";
import { addEventListener } from '../shared/eventListener';
import { XmlRequestWrapper } from '../shared/request';
import FDEventEmitter from '../shared/eventEmitter';

export interface FDRequestData extends MonitorDataRecod {
  timeStart: number // 请求开始时间
  timeEnd: number // 请求响应时间
  async: number // 是否异步
  status: number // 状态
  method?: string // 请求方式
  url: string // 请求地址（短）
  fullUrl?: string // 请求地址（全）
  success: number // 请求是否成功
  statusText?: string // 状态文案
  responseSize: number // 相应体大小
}

// 事件相关
const event = FDEventEmitter.from();
const eventType = 'XmlRequestEvent';

/**
 * XMLHttpRequest构造函数AOP切片
 */
const AOPXMLHttpRequest = (): XMLHttpRequest => XmlRequestWrapper((xhr, OriginalXMLRequest) => {
  // 拦截open方法获取参数数据并记录
  const originOpen = OriginalXMLRequest.prototype.open;
  OriginalXMLRequest.prototype.open = function(...args) {
    this.monitorArgRecord = args;
    return originOpen.apply(this, args);
  }
  // 监听数据处理上报
  eventListener(xhr);
});
window.XMLHttpRequest = AOPXMLHttpRequest as any;

// 事件监听
const eventListener = (xhr: XMLHttpRequest): void => {
  let requestData: FDRequestData;
  // 请求开始监听
  addEventListener(xhr, 'loadstart', function () {
    // console.log('loadstart', this);
    const [method, url, async] = this.monitorArgRecord;
    const now = Date.now();
    requestData = {
      type: 'xhr',
      time: now,
      timeStart: now,
      timeEnd: 0,
      async: async ? 1 : 0,
      method: method.toUpperCase(),
      url,
      fullUrl: '',
      status: 0,
      success: 0,
      responseSize: 0
    };
  });
  // 请求响应监听
  addEventListener(xhr, 'loadend', function () {
    // console.log('loadend', this);
    const { status, responseURL, responseType, response } = this;
    const success: number = (status >= 200 && status <= 206) || status === 304 ? 1 : 0;
    let responseSize = null;
    switch (responseType) {
      case 'json':{
        responseSize = JSON && JSON.stringify(response).length;
        break;
      }
      case 'blob':
      case 'moz-blob': {
        responseSize = response.size;
        break;
      }
      case 'arraybuffer': {
        responseSize = response.byteLength;
        break;
      }
      case 'document': {
        responseSize =
          response.documentElement &&
          response.documentElement.innerHTML &&
          response.documentElement.innerHTML.length + 28;
        break;
      }
      default:
        responseSize = response.length;
    }
    requestData = {
      ...requestData,
      timeEnd: Date.now(),
      success,
      status,
      fullUrl: responseURL,
      responseSize,
    };
    event.emit(eventType, requestData);
  });
};


/**
 * fetch api封装
 */
if (window.fetch) {
  const originFetch = window.fetch;
  window.fetch = function wrapper(...args) {
    let [fetchInput] = args;
    let method = 'GET';
    let url;

    if (typeof fetchInput === 'string') {
      url = fetchInput;
    } else if ('Request' in window && fetchInput instanceof window.Request) {
      url = fetchInput.url;
      method = fetchInput.method || method;
    } else {
      url = `${fetchInput}`;
    }

    if (args[1] && args[1].method) {
      method = args[1].method;
    }

    const now = Date.now();
    let requestData: FDRequestData = {
      type: 'fetch',
      time: now,
      timeStart: now,
      timeEnd: 0,
      async: 1,
      method: method.toUpperCase(),
      url,
      fullUrl: url,
      status: 0,
      success: 0,
      responseSize: 0
    };
    // 发起请求
    return originFetch.apply(this, args).then((response: Response) => {
      const { ok, status } = response;
      const timeEnd = Date.now();
      // 拦截json方法
      const originJson = response.json.bind(response);
      response.json = (...args) => originJson(...args).then((result) => {
        let responseSize = 0;
        let hasError = false;
        try {
          responseSize = JSON && JSON.stringify(result).length;
        } catch (e) {
          hasError = true;
        } finally {
          requestData = {
            ...requestData,
            timeEnd,
            status,
            success: hasError ? 0 : (ok ? 1 : 0),
            responseSize,
          }
          event.emit(eventType, requestData);
        }
        return Promise.resolve(result);
      });
      return response;
    });
  }
}

export default {
  init(cb?: InitCallback, stateInfo?: FDStateInfo) {
    event.addEventListener(eventType, payload => cb && cb(payload));
  },
};
