import { Dictionary } from './definition';

// 事件对象定义
export interface EventEmitter {
  isSingle: boolean;
  // 获取回调列表
  getCallbackList(): Callbacks;
  // 添加事件监听
  addEventListener(type: string, handler: Function): EventEmitter;
  // 移除事件监听
  removeEventListener(type: string, handler: Function): void;
  // 添加事件监听，同addEventListener
  on(type: string, handler: Function): EventEmitter;
  // 添加事件监听，只执行一次
  once(type: string, handler: Function): EventEmitter;
  // 派发事件
  emit(type: string, ...args: any[]): void;
  // 清除(所有)事件
  clear(type?: string): void;
}

export interface Callbacks {
  token?: FDEventEmitter;
  callbackList: Dictionary<Function[]>;
  instanceCallbackList?: Callbacks[];
}

export const NO_SINGLE = 'noSingle';

// 事件回调列表对象
const callbacks: Callbacks = {
  callbackList: {},
  instanceCallbackList: [],
};

export const isBoolean = (bool: any) => toString.call(bool) === '[object Boolean]';

// 事件对象实现
class FDEventEmitter implements EventEmitter {
  isSingle: boolean = true;
  // 单例对象，如果存在将不再创建
  static instance: FDEventEmitter;

  constructor(noSingle?: string) {
    this.isSingle = noSingle !== NO_SINGLE;
    // 如果不是使用多例生成
    if (noSingle !== NO_SINGLE) {
      // 如果不是new当前构造函数
      if (!(this instanceof FDEventEmitter)) {
        FDEventEmitter.instance = new FDEventEmitter(noSingle);
      }
      // 如果还没有任何对象实例化，将当前this给到单例对象
      if (!FDEventEmitter.instance) {
        FDEventEmitter.instance = this;
      }
      // 返回这个对象
      return FDEventEmitter.instance;
    }
    if (!(this instanceof FDEventEmitter)) {
      return new FDEventEmitter(noSingle);
    }
  }

  getCallbackList(): Callbacks {
    if (this.isSingle) return callbacks;
    return callbacks.instanceCallbackList.find((item: Callbacks) => item.token === this);
  }

  on(type: string, handler: Function): FDEventEmitter {
    return this.addEventListener(type, handler);
  }

  once(type: string, handler: Function): FDEventEmitter {
    const that = this;
    const wrapper = function wrapper(...args: any[]) {
      try {
        handler.apply(that, args);
      } catch (e) {
        console.log("once function call error: ", e);
      } finally {
        that.removeEventListener(type, wrapper);
      }
    };
    wrapper.isOnce = true;
    return this.addEventListener(type, wrapper);
  }

  emit(type: string, ...args: any[]): void {
    const { callbackList } = this.getCallbackList();
    if (!callbackList[type]) return;
    let count = 0;
    const loop = () => {
      const handler = callbackList[type][count];
      if (!handler) return;
      try {
        handler.apply(this, args);
      } catch (e) {
        console.log("event loop error: ", e);
      }
      if (!(handler as any).isOnce) count += 1;
      if (callbackList[type][count]) loop();
    };
    loop();
  }

  clear(type?: string): void {
    let cbs: Callbacks = this.getCallbackList();
    if (!cbs) {
      cbs = { token: this, callbackList: {} } as Callbacks;
      callbacks.instanceCallbackList.push(cbs);
    }
    const { callbackList } = cbs;
    if (!isBoolean(type)) {
      type = type as string;
      if (!callbackList[type]) return;
      delete cbs.callbackList[type];
    }
    // 传入的类型是严格等于true的就重置整个事件列表对象
    if (isBoolean(type) && type) {
      cbs.callbackList = {};
    }
  }

  addEventListener(type: string, handler: Function): FDEventEmitter {
    let cbs: Callbacks = this.getCallbackList();
    if (!cbs) {
      cbs = { token: this, callbackList: {} } as Callbacks;
      callbacks.instanceCallbackList.push(cbs);
    }
    const { callbackList } = cbs;
    if (callbackList[type]) {
      callbackList[type].push(handler);
    } else {
      callbackList[type] = [handler];
    }
    return this;
  }

  removeEventListener(type: string, handler: Function) {
    if (!type) return;
    const cbs: Callbacks = this.getCallbackList();
    const lists: Function[] = cbs.callbackList[type];
    if (lists) {
      if (handler) {
        const newCallbacks = lists.filter((fn) => fn !== handler);
        cbs.callbackList[type] = newCallbacks;
      } else {
        delete cbs.callbackList[type];
      }
    }
  }

  static from(): FDEventEmitter {
    return new FDEventEmitter();
  }
}

export default FDEventEmitter;
