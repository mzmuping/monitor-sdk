import { FDStateInfo } from '../state'
import { InitCallback } from '../shared/definition';
import { MonitorDataRecod } from '../shared/definition';
import { filterTime, random, debounce } from '../shared/utils';
import { windowAddEventListener, documentAddEventListener } from '../shared/eventListener';
import { divide, multiply } from 'src/shared/math';

export interface FDResourceData extends MonitorDataRecod {
  fileName: string
  status: string // 资源状态
  duration?: number
  redirect?: number // 重定向
  dns?: number // DNS解析
  connect?: number // TCP建连
  network?: number // 网络总耗时
  send?: number // 发送开始到接受第一个返回
  receive?: number // 接收总时间
  request?: number // 总时间
  ttfb?: number // 首字节时间
}

// 解析资源性能数据
const resolvePerformanceTiming = (timing: PerformanceResourceTiming): FDResourceData => {
  const o: FDResourceData = {
    type: timing.initiatorType,
    time: Date.now(),
    fileName: timing.name,
    status: 'load success',
    duration: timing.duration,
    redirect: filterTime(timing.redirectEnd, timing.redirectStart), // 重定向
    dns: filterTime(timing.domainLookupEnd, timing.domainLookupStart), // DNS解析
    connect: filterTime(timing.connectEnd, timing.connectStart), // TCP建连
    network: filterTime(timing.connectEnd, timing.startTime), // 网络总耗时

    send: filterTime(timing.responseStart, timing.requestStart), // 发送开始到接受第一个返回
    receive: filterTime(timing.responseEnd, timing.responseStart), // 接收总时间
    request: filterTime(timing.responseEnd, timing.requestStart), // 总时间

    ttfb: filterTime(timing.responseStart, timing.requestStart), // 首字节时间
  };

  return o;
};

// 解析资源
const resolveEntries = (entries: PerformanceEntry[]): FDResourceData[] => entries.map((item: PerformanceResourceTiming) => resolvePerformanceTiming(item));

// 控制获取资源所占百分比，默认是百分之5
const getSourcePercent = 5;

export default {
  init(cb?: InitCallback, stateInfo?: FDStateInfo) {
    const w: any = window as any;
    // performance对象
    const pf: Performance = w.performance || w.msPerformance || w.webkitPerformance || w.mozPerformance;
    const callBack = (data: MonitorDataRecod) => cb && cb(data);
    // 当前浏览器不支持此功能
    if (!pf) {
      const notSupportData: MonitorDataRecod = { support: false, type: 'resource', time: Date.now() };
      callBack(notSupportData);
      return;
    }
    // if (w.PerformanceObserver) {
    //   const observer = new w.PerformanceObserver((list) => {
    //     try {
    //       const entries: PerformanceEntry[] = list.getEntries();
    //       resolveEntries(entries).forEach((entry: FDResourceData) => callBack(entry));
    //     } catch (e) {
    //       console.error(e);
    //     }
    //   });
    //   observer.observe({
    //     entryTypes: ['resource']
    //   });
    // } else {

        windowAddEventListener('load', () => {
          // 此变量存放所有已经被处理过的资源加载记录
          let entriesPool: PerformanceEntry[] = [];
          // 过滤得到未处理的记录
          const filterUnRecordedEntries = (entries: PerformanceEntry[]): PerformanceEntry[] =>
            entries
              .filter((entry: PerformanceResourceTiming) => {
                // console.log(entry);
                return ["xmlhttprequest", "fetch"].indexOf(entry.initiatorType) === -1;
              })
              .filter((entry, index) => entry !== entriesPool[index] || entry.name !== entriesPool[index].name);

          // 根据百分比获取对应的数据
          const getEntriesByPercent = (sourceList: PerformanceEntry[], percent: number): PerformanceEntry[] => {
            const entries: PerformanceEntry[] = [];
            const numberList: number[] = [];
            const percentNum = divide(percent, 100);
            const len = sourceList.length;
            let num: number = parseInt(`${multiply(len, percentNum)}`);
            // 说明是全量收集
            if (num >= len) {
              return [...sourceList];
            }
            let num2;
            while(num > 0) {
              num2 = parseInt(random(len) + '');
              if (numberList.indexOf(num2) === -1) {
                numberList.push(num2);
                num--;
              }
            }
            for(let i = 0; i < numberList.length; i++) {
              entries.push(sourceList[numberList[i]]);
            }
            return entries;
          }

          // 解析资源
          let entries: PerformanceEntry[] = performance.getEntriesByType('resource');
          entries = getEntriesByPercent(filterUnRecordedEntries(entries), getSourcePercent);
          resolveEntries(entries).forEach((entry: FDResourceData) => callBack(entry));
          entriesPool = entries;

          // 页面onload之后全局监听后续可能被动态加载进来的资源
          documentAddEventListener('load', debounce(() => {
            // 后续被加载进来的资源记录（其中会含有之前的记录）
            const subsequentEntries: PerformanceEntry[] = performance.getEntriesByType('resource');
            const newEntries = getEntriesByPercent(filterUnRecordedEntries(subsequentEntries), getSourcePercent);
            resolveEntries(newEntries).forEach((entry: FDResourceData) => callBack(entry));
            // 更新旧记录
            entriesPool = [...entriesPool, ...newEntries];
          }), true /* 使用事件捕获防止事件被取消冒泡监听不到 */);
        });
        // 监听资源加载失败
        windowAddEventListener('error', (e: any) => {
          const type = e.target.localName;
          const types = ['link', 'script'];
          if (types.indexOf(type) === -1) return;
          let fileName = '';
          switch (type) {
            case types[0]: {
              fileName = e.target.href;
              break;
            }
            case types[1]: {
              fileName = e.target.src;
              break;
            }
            default:
              break;
          }
          const resourceData: FDResourceData = {
            type,
            fileName,
            time: Date.now(),
            status: "load fail",
          };
          callBack(resourceData);
        }, true /* 使用事件捕获，否则事件监听不到 */);


    // }
  },
};
