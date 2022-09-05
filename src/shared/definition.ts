// 全局定义文件


// 监控类型
export enum MonitorType {
  ROOT_DATA = 'rootMonitorData', // 根数据类型
  ACTION = 'action', // 行为监控
  ERROR = 'error', // 异常监控
  PERFORMANCE = 'performance', // 性能监控
  REQUEST = 'request', // 请求监控
  RESOURCE = 'resource', // 资源监控
  CUSTOM_INFO = 'customInfo', // 自定义信息
  ROUTE_CHANGE = 'routeChange', // 路由变更
  EMPTY = '', // 空类型

  // 事件类型
  ACTION_TAP = 'tap', // 移动端点击事件
  ACTION_CLICK = 'click', // 点击事件
  ACTION_TOUCH = 'touch', // 移动端触摸事件
}

// 错误令牌
export enum MonitorErrorToken {
  ROOT_TOKEN = 'rootErrorToken',
}

export interface MonitorEvent {
  type: string; // 监控基础数据类型
  support?: boolean; // 是否支持此功能
  payload?: any; // 提供
}

// 监控基础数据约束
export interface MonitorDataRecod extends MonitorEvent {
  time: number; // 数据产生时间
  pageid?: string; // 页面id
}

export interface MonitorConfig {
  application: string; // 应用名字
  uploadUrl: string; // 上传接口，所有记录都将在这里上传
  sourcemapDir?: string; // sourcemap文件目录地址
}

// 字典
export interface Dictionary<T> { [key: string]: T }

// init回调函数约束
export type InitCallback = (monitorData: MonitorDataRecod) => any;

// 此变量用于储存当前唯一id值到缓存中的key
export const MONITOR_LIFE_ID_KEY = 'monitorLifeIdKey';


