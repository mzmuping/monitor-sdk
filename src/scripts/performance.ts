import { MonitorDataRecod, InitCallback } from '../shared/definition'
import { NONE } from '../shared/platform'
import { windowOnLoad, documentAddEventListener } from '../shared/eventListener'
import { FDStateInfo } from '../state'
import { filterTime } from '../shared/utils'

export enum FDEntryType {
  TYPE_NAVIGATE = 'TYPE_NAVIGATE',
  TYPE_RELOAD = 'TYPE_RELOAD',
  TYPE_BACK_FORWARD = 'TYPE_BACK_FORWARD',
  TYPE_RESERVED = 'TYPE_RESERVED'
}

// 上一次访问数据
export type FDPreVisitData = {
  preLifeId: string // 上一次访问唯一标识
  entryType: FDEntryType // 进入当前页面方式
  referrer: string // 上一个页面地址（通过浏览器的前进、后退按钮进入的页面与正常方式进入页面会有）
}

// 性能时间，以毫秒为单位(ms)
export type FDPerformanceTimes = {
  // 网络建连
  pervPage: number, // 上一个页面
  redirect: number, // 页面重定向时间
  dns: number, // DNS查找时间
  connect: number, // TCP建连时间
  network: number, // 网络总耗时

  // 网络接收
  send: number, // 前端从发送到接收到后端第一个返回
  receive: number, // 接受页面时间
  request: number, // 请求页面总时间

  // 前端渲染
  dom: number, // dom解析时间
  loadEvent: number, // loadEvent时间
  frontend: number, // 前端总时间

  // 关键阶段
  load: number, // 页面完全加载总时间
  domReady: number, // domready时间
  interactive: number, // 可操作时间
  ttfb: number,  // 首字节时间
}

// 页面性能数据
export interface FDPerformanceData extends MonitorDataRecod {
  navInfo: FDPreVisitData; // 页面导航信息，此页面不是浏览器第一时间打开的页面，将会携带有进入此页面的上一个页面信息
  times: FDPerformanceTimes; // 页面性能时间
}

// 全局数据对象
let globalStateInfo: FDStateInfo;

export default {
  init(cb?: InitCallback, stateInfo?: FDStateInfo) {
    const cycleFreq = 100; // 循环轮询的时间
    const w: any = window as any;
    // performance对象
    const pf = w.performance || w.msPerformance || w.webkitPerformance || w.mozPerformance;
    let isDOMReady = false;
    let isOnload = false;
    let onloadTimer = null;
    let onDomReadyTimer = null;

    // 当前浏览器不支持此功能
    if (!pf) {
      const notSupportData: MonitorDataRecod = { support: false, type: 'performance', time: Date.now() };
      cb && cb(notSupportData);
      return;
    }

    // 全局数据对象赋值
    globalStateInfo = stateInfo;

    // 在dom准备好时检查性能数据
    const onDomReadyRunCheck = () => {
      if (pf.timing.domInteractive) {
        clearTimeout(onDomReadyTimer);
        // 计算数据
        const performanceData = this.getPerformanceData(pf);
        performanceData.type = 'onDomReady';
        cb && cb(performanceData);
        isDOMReady = true;
      } else {
        onDomReadyTimer = setTimeout(onDomReadyRunCheck, cycleFreq);
      }
    }
    // 在load事件检查性能数据
    const onloadRunCheck = () => {
      if (pf.timing.loadEventEnd) {
        clearTimeout(onloadTimer);
        // 计算数据
        const performanceData = this.getPerformanceData(pf);
        performanceData.type = 'onLoad';
        cb && cb(performanceData);
        isOnload = true;
      } else {
        onloadTimer = setTimeout(onloadRunCheck, cycleFreq);
      }
    }

    // 在浏览器load事件时获取性能数据
    const getPerformanceDataOnDomReady = () => {
      if ( isOnload === true ) return;
      if ( document.readyState === 'interactive' ) {
        onDomReadyRunCheck();
      } else {
        documentAddEventListener({
          standard: 'DOMContentLoaded', // 标准浏览器支持事件名
          unstandard: 'onreadystatechange' // 非标准浏览器支持事件名（ie）
        }, () => onDomReadyRunCheck());
      }
    }
    // 在浏览器load事件时获取性能数据
    const getPerformanceDataOnload = () => windowOnLoad(() => onloadRunCheck());

    // 调用计算
    getPerformanceDataOnDomReady();
    getPerformanceDataOnload();
  },
  // 获取performance数据
  getPerformanceData({ navigation, timing }: Performance): FDPerformanceData {
    const performanceData: FDPerformanceData = {
      type: '',
      time: Date.now(),
      navInfo: this.getNavInfo(navigation),
      times: this.getTimes(timing)
    };
    return performanceData;
  },
  // 获取上一个页面地址
  getReferrer(): string {
    return document.referrer || NONE;
  },
  // 获取跳转数据
  getNavInfo(navigation: PerformanceNavigation): FDPreVisitData {
    const navInfo: FDPreVisitData = {
      preLifeId: globalStateInfo ? globalStateInfo.preLifeId : '',
      entryType: FDEntryType.TYPE_NAVIGATE, // 默认正常进入
      referrer: ''
    };
    const { type } = navigation;
    switch (type) {
      // 正常进入该页面(非刷新、非重定向)
      case navigation.TYPE_NAVIGATE: {
        navInfo.referrer = this.getReferrer();
        break;
      }
      // 通过 window.location.reload 刷新的页面
      case navigation.TYPE_RELOAD: {
        navInfo.entryType = FDEntryType.TYPE_RELOAD;
        break;
      }
      // 通过浏览器的前进、后退按钮进入的页面
      case navigation.TYPE_BACK_FORWARD: {
        navInfo.entryType = FDEntryType.TYPE_BACK_FORWARD;
        navInfo.referrer = this.getReferrer();
        break;
      }
      // 非以上的方式进入页面的
      case navigation.TYPE_RESERVED:
      default: {
        navInfo.entryType = FDEntryType.TYPE_RESERVED;
        break;
      }
    }
    return navInfo;
  },
  // 获取页面时间相关
  getTimes(timing: PerformanceTiming): FDPerformanceTimes {
    const timesInfo: FDPerformanceTimes = {
      // 网络建连
      pervPage: filterTime(timing.fetchStart, timing.navigationStart), // 上一个页面
      redirect: filterTime(timing.responseEnd, timing.redirectStart), // 页面重定向时间
      dns: filterTime(timing.domainLookupEnd, timing.domainLookupStart), // DNS查找时间
      connect: filterTime(timing.connectEnd, timing.connectStart), // TCP建连时间
      network: filterTime(timing.connectEnd, timing.navigationStart), // 网络总耗时

      // 网络接收
      send: filterTime(timing.responseStart, timing.requestStart), // 前端从发送到接收到后端第一个返回
      receive: filterTime(timing.responseEnd, timing.responseStart), // 接受页面时间
      request: filterTime(timing.responseEnd, timing.requestStart), // 请求页面总时间

      // 前端渲染
      dom: filterTime(timing.domComplete, timing.domLoading), // dom解析时间
      loadEvent: filterTime(timing.loadEventEnd, timing.loadEventStart), // loadEvent时间
      frontend: filterTime(timing.loadEventEnd, timing.domLoading), // 前端总时间

      // 关键阶段
      load: filterTime(timing.loadEventEnd, timing.navigationStart), // 页面完全加载总时间
      domReady: filterTime(timing.domContentLoadedEventStart, timing.navigationStart), // domready时间
      interactive: filterTime(timing.domInteractive, timing.navigationStart), // 可操作时间
      ttfb: filterTime(timing.responseStart, timing.navigationStart),  // 首字节时间
    };

    return timesInfo;
  }
};
