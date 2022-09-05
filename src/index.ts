import { FDStateInfo } from './state/index';
import { FDAction, FDError, FDPerformance, FDRequest, FDSource, FDRoute } from './scripts'

import State from './state'

import { MonitorType, MonitorDataRecod, MonitorEvent, MonitorConfig } from './shared/definition';
import FDEventEmitter from './shared/eventEmitter';
import { copyState } from './shared/utils';
import { Strategy, StrategyHandler } from './state/strategy';
import { windowAddEventListener } from './shared/eventListener';

// 声明事件对象
const event = FDEventEmitter.from();
const addMonitorDataEvent = 'addDataToMonitor';
const addHistoryDataEvent = 'addHistoryToMonitor';

// 上传路径初始化
const uploadUrlForScript: HTMLScriptElement = document.querySelector('script[data-monitor-upload-url]');
const sdkScriptSrc: string = uploadUrlForScript?.getAttribute('src') || '';
const application: string = uploadUrlForScript?.getAttribute('data-monitor-application') || document.title;
const uploadUrl: string|undefined = uploadUrlForScript?.getAttribute('data-monitor-upload-url');

// 设置默认上传路径
State.config({ application, uploadUrl });

// 全局数据状态
let globalState: FDStateInfo;

// 监控skd顶级对象
const FdFeMonitor = {
  FDAction, // 行为监控
  FDError, // 异常监控
  FDPerformance, // 性能监控
  FDRequest, // 请求监控
  FDSource, // 资源监控
  FDRoute, // 路由信息收集对象
  FDEventEmitter, // 事件管理类（实例化的对象都为同一个 ———— 单例对象）
  // 启动
  init() {
    // 状态初始化
    globalState = State.init();

    // 添加事件监听
    event.addEventListener(addMonitorDataEvent, (event: MonitorEvent) => State.commit(event));

    // 添加路由事件监听
    event.addEventListener(addHistoryDataEvent, (path: string, fullPath?: string) => FDRoute.init(
      path, // 路径
      fullPath,
      (payload: MonitorDataRecod) => event.emit(addMonitorDataEvent, { type: MonitorType.ROUTE_CHANGE, payload }),
      globalState
    ));

    // 响应事件
    FDError.init((payload: MonitorDataRecod) => event.emit(addMonitorDataEvent, { type: MonitorType.ERROR, payload }), globalState);
    FDAction.init((payload: MonitorDataRecod) => event.emit(addMonitorDataEvent, { type: MonitorType.ACTION, payload }), globalState);
    FDPerformance.init((payload: MonitorDataRecod) => event.emit(addMonitorDataEvent, { type: MonitorType.PERFORMANCE, payload }), globalState);
    FDRequest.init((payload: MonitorDataRecod) => event.emit(addMonitorDataEvent, { type: MonitorType.REQUEST, payload }), globalState);
    FDSource.init((payload: MonitorDataRecod) => event.emit(addMonitorDataEvent, { type: MonitorType.RESOURCE, payload }), globalState);

      // 页面关闭上报数据
    const pageOnUnload = () => {
      if (globalState.recodEventList.length > 1) {
        State.addUploadTask(globalState);
        State.taskCall().then(() => {
          State.removeCache(globalState.lifeId);
        });
      }
    }
    if (typeof window.onbeforeunload !== 'undefined') {
      windowAddEventListener('beforeunload', pageOnUnload);
    } else {
      windowAddEventListener('unload', pageOnUnload);
    }
  },
  // 添加自定义信息
  addCustomInfo(payload: MonitorDataRecod): void {
    const now = Date.now();
    State.commit({
      type: MonitorType.CUSTOM_INFO,
      payload: { type: MonitorType.CUSTOM_INFO, time: now, ...payload },
    });
  },
  // 添加路由历史记录
  addHistoryToStack(path: string, fullPath?: string): void {
    event.emit(addHistoryDataEvent, path, fullPath);
  },
  // 获取状态
  // 获取到的状态是只读状态，外部修改返回的状态不影响内部状态
  getState(): FDStateInfo {
    return copyState(globalState || {});
  },
  // 配置项
  config(config: MonitorConfig): void {
    State.config(config);
  },

  clearUploadStrategys() {
    State.clearUploadStrategys();
  },

  addUploadStrategy(strategy: Strategy) {
    State.addUploadStrategy(strategy);
  },

  modifyUploadStrategy(strategyName: string, handler: StrategyHandler) {
    State.modifyUploadStrategy(strategyName, handler);
  },
}

// 如果是直接用script标签引入的就自动调用init方法
if (sdkScriptSrc.indexOf('fd-fe-monitor-sdk') > -1) FdFeMonitor.init();

export default FdFeMonitor;



