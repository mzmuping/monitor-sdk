type EventObj = {
  standard: string
  unstandard: string
}

// 添加事件监听
export const addEventListener = (obj: any, type: EventObj|string, handler: Function, useCapture?: boolean): Function|undefined => {
  if (!type || !obj || !handler) return;
  // 回调事件函数包装
  const wrapper = function (e: Event) { handler.call(this, e); }
  const eventType: EventObj = type as EventObj;
  let standardEventName: string = ''; // 标准浏览器支持事件名
  let unstandardEventName: string = ''; // 非标准浏览器支持事件名(ie)

  if (eventType.standard) {
    standardEventName = eventType.standard;
    unstandardEventName = `on${eventType.unstandard}`;
  } else {
    standardEventName = unstandardEventName = type as string;
  }

  if (obj.addEventListener) {
    obj.addEventListener(standardEventName, wrapper, useCapture);
  } else if (obj.attachEvent) {
    obj.attachEvent(unstandardEventName, wrapper);
  }

  // 返回取消事件监听
  return () => {
    if (obj.removeEventListener) {
      return obj.removeEventListener(standardEventName, wrapper);
    } else if (obj.detachEvent) {
      return obj.detachEvent(unstandardEventName, wrapper);
    }
  }
}

// 窗口事件监听
export const windowAddEventListener = (type: EventObj|string, handler: Function, useCapture?: boolean): Function => addEventListener(window, type, handler, useCapture);
// 页面load事件
export const windowOnLoad = (handler: Function): void => {
  // 文档已经准备完成，说明load已经触发
  if (document.readyState === 'complete') {
    handler.call(window);
    return;
  }
  // 添加onload监听
  windowAddEventListener('load', handler);
}

// 文档事件监听
export const documentAddEventListener = (type: EventObj|string, handler: Function, useCapture?: boolean): Function => addEventListener(document, type, handler, useCapture);

