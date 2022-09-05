import { MonitorErrorToken } from './definition';

// 自定义错误
export default class FDMonitorError extends Error {
  errorToken: MonitorErrorToken;

  constructor(...args: any[]) {
    super(...args);
    this.errorToken = MonitorErrorToken.ROOT_TOKEN;
  }
}
