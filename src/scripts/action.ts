import { FDStateInfo } from '../state'
import { MonitorDataRecod, InitCallback, MonitorType } from '../shared/definition';
import { documentAddEventListener, windowAddEventListener } from "../shared/eventListener";
import getXpath from '../shared/xpath';

// 位置数据约定
export type Position = { x: number, y: number }

// 连续事件的记录
export interface ConsecutiveEventsRecord {
  timeStart: number // 连续事件开始时间
  timeEnd: number // 连续事件开始时结束时间
  positionStart: Position // 事件开始在页面的位置
  positionEnd: Position // 事件结束在页面的位置
}

export interface FDActionData extends MonitorDataRecod {
  xpath: string // 事件响应元素xpath路径
  isConsecutiveEvents: boolean // 是否是多事件组成的连续事件（如touch事件=touchstart->touchmove->touchend）
  description?: string // 事件响应元素对应的说明（如果用户设置了monitor-desc属性的话）
  consecutiveEventsRecord?: ConsecutiveEventsRecord // 连续事件的记录信息
}

// 需要处理的事件
export enum HandlerEvent {
  CLICK = 'click', // 点击事件
  TOUCH_START = 'touchstart', // 手指滑动事件-开始
  TOUCH_MOVE = 'touchmove', // 手指滑动事件-移动
  TOUCH_END = 'touchend', // 手指滑动事件-结束
  TOUCH_CANCEL = 'touchcancel', // 手指滑动事件-取消
  HASH_CHANGE = 'hashchange', // 哈希变更（考虑单页应用使用hash路由）
  HISTORY_POPSTATE = 'popstate', // 历史记录变更（考虑单页应用使用history模式路由）
}

// 处理移动端连续事件触摸，考虑下面三种情况
// 1.touchstart->touchmove->touchend
// 2.touchstart->touchend
// 3.touchstart->touchmove->touchcancel
const handlerTouchAction = ((): Function => {
  // 此标记录一个连续的事件数据
  let consecutiveEventsRecord: ConsecutiveEventsRecord|undefined;
  let lastTouch: Touch;
  // 处理函数
  return (e: TouchEvent, event: HandlerEvent): ConsecutiveEventsRecord => {
    switch (event) {
      case HandlerEvent.TOUCH_START: {
        lastTouch = e.touches[0];
        consecutiveEventsRecord = {
          timeStart: Date.now(),
          timeEnd: 0,
          positionStart: {
            x: lastTouch.clientX,
            y: lastTouch.clientY
          },
          positionEnd: {
            x: 0,
            y: 0
          },
        }
        break;
      }
      case HandlerEvent.TOUCH_MOVE:
        lastTouch = e.touches[0];
        break;
      case HandlerEvent.TOUCH_END:
      case HandlerEvent.TOUCH_CANCEL:
      default: {
        consecutiveEventsRecord = {
          ...consecutiveEventsRecord,
          timeEnd: Date.now(),
          positionEnd: {
            x: lastTouch.clientX,
            y: lastTouch.clientY
          }
        };
        break;
      }
    }
    return consecutiveEventsRecord;
  }
})();

export default {
  init(cb?: InitCallback, stateInfo?: FDStateInfo) {
    const callBack = (data: MonitorDataRecod) => cb && cb(data);

    // 事件监听处理
    const eventListenerHandler = (eventType: HandlerEvent): Function => (e: Event) => {
      // 行为数据
      const actionData: FDActionData = {
        type: MonitorType.EMPTY, // 事件类型
        isConsecutiveEvents: false, // 默认不是连续事件
        time: Date.now(), // 事件开始
        xpath: "",
      };
      const target: Element = e.target as Element;
      // 此标记录一个连续的事件数据
      let consecutiveEventsRecord: ConsecutiveEventsRecord|undefined;
      let timeStart: number;
      let timeEnd: number;
      // 连续事件touch
      const consecutiveEventTouch: HandlerEvent[] = [HandlerEvent.TOUCH_CANCEL, HandlerEvent.TOUCH_END, HandlerEvent.TOUCH_START, HandlerEvent.TOUCH_MOVE];
      if (consecutiveEventTouch.indexOf(eventType) > -1) {
        consecutiveEventsRecord = handlerTouchAction(e, eventType);
        timeStart = consecutiveEventsRecord.timeStart;
        timeEnd = consecutiveEventsRecord.timeEnd;
        if (timeEnd) {
          if (timeEnd - timeStart < 200) {
            actionData.type = MonitorType.ACTION_TAP;
          } else {
            actionData.type = MonitorType.ACTION_TOUCH;
            actionData.isConsecutiveEvents = true;
            actionData.consecutiveEventsRecord = consecutiveEventsRecord;
          }
        }
      } else {
        actionData.type = MonitorType.ACTION_CLICK;
      }
      const xpath = getXpath(target); // 获取元素xpath路径
      const description = target.getAttribute('monitor-desc'); // 行为说明
      actionData.xpath = xpath;
      if (description) actionData.description = description;

      // 有效数据提交
      if (!consecutiveEventsRecord || consecutiveEventsRecord.timeEnd) {
        callBack(actionData);
      }
    }

    // 事件监听
    documentAddEventListener(HandlerEvent.CLICK, eventListenerHandler(HandlerEvent.CLICK), true /* 使用事件捕获防止事件被取消冒泡监听不到 */);
    documentAddEventListener(HandlerEvent.TOUCH_START, eventListenerHandler(HandlerEvent.TOUCH_START), true /* 使用事件捕获防止事件被取消冒泡监听不到 */);
    documentAddEventListener(HandlerEvent.TOUCH_MOVE, eventListenerHandler(HandlerEvent.TOUCH_MOVE), true /* 使用事件捕获防止事件被取消冒泡监听不到 */);
    documentAddEventListener(HandlerEvent.TOUCH_END, eventListenerHandler(HandlerEvent.TOUCH_END), true /* 使用事件捕获防止事件被取消冒泡监听不到 */);
    documentAddEventListener(HandlerEvent.TOUCH_CANCEL, eventListenerHandler(HandlerEvent.TOUCH_CANCEL), true /* 使用事件捕获防止事件被取消冒泡监听不到 */);

    // // 路由变更事件方法处理
    // const routerChangeHandler = () => {}

    // if (history) {
    //   // history pushState方法包装
    //   const originHistoryPushState = history.pushState.bind(history);
    //   history.pushState = (...args: any[]) => {
    //     try {
    //       originHistoryPushState(...args);
    //     } catch (e) {}
    //   }
    //   // history replaceState方法包装
    //   const originHistoryReplaceState = history.replaceState.bind(history);
    //   history.pushState = (...args: any[]) => {
    //     try {
    //       originHistoryReplaceState(...args);
    //     } catch (e) { }
    //   }
    // }

    // // 路由变化记录（hash）
    // windowAddEventListener(HandlerEvent.HASH_CHANGE, () => {
    //   debugger;
    // });


    // // 路由变更记录（history）
    // windowAddEventListener(HandlerEvent.HISTORY_POPSTATE, () => {
    //   // debugger;
    // });
  }
}
