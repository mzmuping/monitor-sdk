import { FDStateInfo } from 'src/state';
import { addEventListener } from './eventListener';

// 保存原始XMLHttpRequest构造函数
const OriginalXMLRequest = window.XMLHttpRequest;
export const XmlRequestWrapper = (
  wrapper?: (
    xhr: XMLHttpRequest,
    originalXMLRequest: Function /* 这是XMLHttpRequest的构造函数 */
  ) => void
): XMLHttpRequest => {
  const xhr: XMLHttpRequest = new OriginalXMLRequest();
  wrapper && wrapper(xhr, OriginalXMLRequest);
  return xhr;
};


// 数据上传
export const uploadData = (url: string, stateInfo: FDStateInfo): Promise<XMLHttpRequest> =>
  new Promise((resolve, reject) => {
    const xhr = XmlRequestWrapper();
    // 请求成功回调函数
    addEventListener(xhr, 'load', (e: Event) => {
      const result: XMLHttpRequest = e.target as XMLHttpRequest;
      const { status } = result;
      if ((status >= 200 && status < 300) || status === 304) resolve(result);
      else reject(result);
    });
    // 请求出错
    addEventListener(xhr, 'error', (e: Event) => reject(e.target));
    // 请求超时
    addEventListener(xhr, 'timeout', (e: Event) => reject(e.target));
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(stateInfo));
  });
