import { FDStateInfo } from '../state'
import { InitCallback, MonitorDataRecod } from '../shared/definition';
import { windowAddEventListener } from '../shared/eventListener';
import FDMonitorError from 'src/shared/error';

export interface FDErrorData extends MonitorDataRecod {
  message: string // 错误信息
  file: string // 错误的文件
  line: number|string // 错误行号
  column: number|string // 错误列
  stack: string // 错误栈信息
}

export default {
  init(cb?: InitCallback, stateInfo?: FDStateInfo) {

    // 错误处理
    const errorHandler = (err: Error) => {
      if (!err) return;
      // 如果是自定义错误就不收集
      if ((err as FDMonitorError).errorToken) return;
      const { stack } = err;
      const Splitters = stack.indexOf('\n') > -1 ? '\n' : '\r\n';
      const reg = /([^\s]+?:\/\/.+?):(\d+):(\d+)/gi;
      const lineList = stack.split(Splitters).map((line) => line.trim());
      const [errorTypeAndMessage, errorFileAndLineColumn] = lineList;
      const [errorType, message] = errorTypeAndMessage.split(': ');
      const [, file, line, column] = reg.exec(errorFileAndLineColumn);
      const errorInfo: FDErrorData = {
        type: errorType,
        time: Date.now(),
        message,
        stack,
        file,
        line,
        column,
      };
      cb && cb(errorInfo);
    }

    // 全局捕获js运行
    windowAddEventListener('error', (e: ErrorEvent) => errorHandler(e.error));
    // 全局捕获Promise错误
    windowAddEventListener('unhandledrejection', (e: PromiseRejectionEvent) => errorHandler(e.reason));
  },
}
