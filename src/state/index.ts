import { MonitorType, Dictionary, MONITOR_LIFE_ID_KEY, MonitorDataRecod, MonitorEvent, MonitorConfig } from 'src/shared/definition';
import { getUid, urlParse, debounce, copyState, copyState2 } from "src/shared/utils";
import { os, osVersion, platform, engine, engineVersion, shell } from 'src/shared/platform';
import { FDRouteData } from 'src/scripts/route';
import { uploadData } from 'src/shared/request';
import localforage from 'localforage';
import StrategyMatch, { Strategy, StrategyHandler, clearUploadStrategys, addUploadStrategy, modifyUploadStrategy } from "./strategy";
import FDMonitorError from 'src/shared/error';

export interface FDStateInfo extends MonitorDataRecod {
  application: string; // 应用的名称
  preLifeId: string; // 上一次页面打开开始记录唯一标识（如果存在）
  lifeId: string; // 页面打开开始记录唯一标识
  browser: Dictionary<string>; // 浏览器与系统平台信息
  path: string; // 当前页面路径
  fullPath: string; // 当前页面路径全
  sourcemapDir?: string; // sourcemap目录地址
  queryObj: Dictionary<string>; // 路径查询字符串
  recodEventList: MonitorEvent[]; // 记录列表
  routeStack: FDRouteData[]; // 路由栈
}

localforage.config({ storeName: `database/${MonitorType.ROOT_DATA}` });

// 一次性上传记录条数限制
const ONCE_UPLOAD_RECORD_LIMIT = 500;

// 标识连续上传失败次数，如果连续上传失败10次就不会再上传了
let uploadFailCount = 0;

// 获取初始状态
const getStateInfo = (): FDStateInfo => ({
  type: MonitorType.ROOT_DATA,
  time: Date.now(), // 状态初始时间记录
  application: '',
  preLifeId: '',
  lifeId: '',
  browser: { os, osVersion, platform, engine, engineVersion, shell },
  path: `${location.origin}${location.pathname}`,
  fullPath: location.href,
  queryObj: {},
  recodEventList: [],
  routeStack: [],
});

// 状态信息
let globalStateInfo: FDStateInfo;

// 数据上报任务队列
const uploadTaskList = [];

// 配置
let monitorConfig: MonitorConfig = {
  application: '',
  uploadUrl: '',
  sourcemapDir: ''
};

// 状态管理
export class FDStore {
  lifeId: string = '';

  // 当前状态实例对象
  static instance: FDStore;

  constructor() {
    if (!(this instanceof FDStore)) {
      FDStore.instance = new FDStore();
    }
    if (!FDStore.instance) {
      FDStore.instance = this;
    }
    return FDStore.instance;
  }

  init(): FDStateInfo {
    console.log('monitorConfig', monitorConfig);
    const lifeId = (this.lifeId = getUid());
    const stateInfo = globalStateInfo = getStateInfo();
    stateInfo.application = monitorConfig.application;
    stateInfo.sourcemapDir = monitorConfig.sourcemapDir;
    stateInfo.lifeId = lifeId;
    stateInfo.queryObj = urlParse();
    stateInfo.routeStack = [{
      type: MonitorType.ROOT_DATA,
      time: stateInfo.time,
      path: stateInfo.path,
      fullPath: stateInfo.fullPath,
      preLifeId: '',
      lifeId,
      queryObj: stateInfo.queryObj
    }]; // 路由栈第一条记录是当前状态

    // 如果存在上一次页面打开开始记录唯一标识
    const preLifeId: string = localStorage.getItem(MONITOR_LIFE_ID_KEY);
    if (preLifeId) {
      stateInfo.preLifeId = preLifeId;
      stateInfo.routeStack[0].preLifeId = preLifeId;
      localStorage.removeItem(MONITOR_LIFE_ID_KEY);
      localforage
        .getItem(preLifeId)
        .then((result: FDStateInfo) => {
          if (!result) return;
          // 如果有缓存数据，就上传
          if (result.recodEventList && result.recodEventList.length > 1) {
            uploadData(monitorConfig.uploadUrl, result)
              // 删除这个缓存
              .then(() => localforage.removeItem(preLifeId))
              .catch((err) => console.log(err));
          }
        });
    }
    // 设置当前
    localforage
      .setItem(lifeId, stateInfo)
      .then(() => localStorage.setItem(MONITOR_LIFE_ID_KEY, lifeId));
    // 返回状态
    return stateInfo;
  }

  // 状态提交
  commit (event: MonitorEvent): void {
    if (!event) return;
    const { payload, type } = event;
    if (type === MonitorType.ROUTE_CHANGE) {
      // 路由变更
      globalStateInfo.routeStack.push(payload);
    } else {
      // 保存数据
      globalStateInfo.recodEventList.push(event);
      const len = globalStateInfo.routeStack.length;
      const lastPage = globalStateInfo.routeStack[len - 1];
      payload.pageid = lastPage.lifeId;
    }
    // 缓存到本地
    this.commit2Localcache();
    this.addUploadTask(globalStateInfo);
    this.dispatch();
  }

  // 本地缓存提交
  commit2Localcache = debounce(function() {
    // 缓存数据
    localforage.setItem(this.lifeId, globalStateInfo);
  }, 16)

  // 数据上报
  dispatch = debounce((): void => {
    // 策略匹配上报
    StrategyMatch(globalStateInfo, () => {
      this.taskCall()
        ?.then(() => this.commit2Localcache())
        ?.catch((err) => console.log(err));
    });
  })

  // 添加上传任务
  addUploadTask(stateInfo: FDStateInfo) {
    // 任务方法定义
    const task = (): Promise<any> => {
      if (!monitorConfig.uploadUrl) {
        const expectStr = "upload url unset!";
        console.warn(expectStr);
        return Promise.reject(new FDMonitorError(expectStr));
      }
      const uploadState: FDStateInfo = copyState2(stateInfo, ['recodEventList']) as FDStateInfo;
      const recodEventList: MonitorEvent[] = stateInfo.recodEventList;
      let length: number = 0;
      if (recodEventList.length > ONCE_UPLOAD_RECORD_LIMIT) {
        uploadState.recodEventList = recodEventList.slice(0, ONCE_UPLOAD_RECORD_LIMIT + 1);
        length = ONCE_UPLOAD_RECORD_LIMIT;
      } else {
        uploadState.recodEventList = copyState(recodEventList);
        length = recodEventList.length;
      }
      if (length === 0) return Promise.resolve();
      return uploadData(monitorConfig.uploadUrl, uploadState).then(
        // 截取后续有可能后续没上传的记录
        () => (stateInfo.recodEventList = recodEventList.slice(length))
      );
    };
    uploadTaskList.push(task);
  }

  taskCall(): Promise<any> {
    if (uploadFailCount >= 10) return;
    const task = uploadTaskList.shift();
    const nextTask = () => this.taskCall();
    let result;
    if (task) result = task().then(() => {
      uploadFailCount = 0;
      nextTask();
    }).catch(() => {
      uploadFailCount += 1;
      nextTask();
    });
    // 如果是最后一个任务，提前返回
    if (task && uploadTaskList.length === 0) return result;
    return result;
  }

  removeCache(id: string) {
    localforage.removeItem(id);
  }

  clearUploadStrategys() {
    clearUploadStrategys();
  }

  addUploadStrategy(strategy: Strategy) {
    addUploadStrategy(strategy);
    this.dispatch();
  }

  modifyUploadStrategy(strategyName: string, handler: StrategyHandler) {
    modifyUploadStrategy(strategyName, handler);
    this.dispatch();
  }

  config(config: MonitorConfig) {
    console.log(config);
    monitorConfig = { ...monitorConfig, ...config };
  }
}

export default new FDStore();
