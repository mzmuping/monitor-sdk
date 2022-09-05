import { Dictionary } from "./definition";

// 用于生成uuid
export const S4 = (): string => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);

// 获取uid串
export const getUid = (): string => `${S4() + S4()}-${S4()}-${S4()}-${S4()}-${S4() + S4() + S4()}`;

/**
 * 路径反斜杠替换处理
 * 例如：https:\/\/img5.chungoulife.com\/201912\/pic536c98a54551e2b01c1efe350bfdb6f4.jpg
 * 在微信浏览器会出现无法解析上面这种路径问题
 */
export const formatUrl = (val: string): string => val.replace(/\\/, '/');

// 根据key获取cookie
export const getCookie = (key: string): string => {
  const arrStr = document.cookie.split('; ');
  for (let i = 0; i < arrStr.length; i++) {
    const temp = arrStr[i].split('=');
    if (temp[0] === key) {
      return decodeURI(temp[1]);
    }
  }
};

// 获取元素style
export const getStyle = (obj, attr: string): string => {
  if (obj.currentStyle) {
    return obj.currentStyle[attr];
  }
  return document.defaultView.getComputedStyle(obj, null)[attr];
};

// 无效参数判断
export const isInValidParam = (param: any): boolean => [0, void 0, '0', '', 'undefined', null, 'null', false].indexOf(param) > -1;

// 补零操作
export const repairZero = (n: string|number): string => (n < 10 ? `0${n}` : `${n}`);

// 判断数组是否为空
export const isEmptyArray = (arr): boolean => toString.call(arr) === '[object Array]' && arr.length === 0;

// 状态拷贝
export const copyState = (state: any): any => JSON.parse(JSON.stringify(state));
// 状态拷贝，可提倡多余字段
export const copyState2 = (originalState, ignoreFields = []) => {
  const state = {};
  Object.keys(originalState).forEach((key) => {
    if (!ignoreFields.includes(key)) state[key] = copyState(originalState[key]);
  });
  return state;
};

/**
 * 防抖函数
 * @param func 事件触发的操作
 * @param delay 间隔多少毫秒需要触发一次事件，默认200毫秒
 * @return {Function} 返回封装好函数
 */
export const debounce = (func: Function, delay: number = 200): Function => {
  let timer: any = null;
  return function handler(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

/**
 * 节流函数
 * @param func 事件触发的操作
 * @param delay 间隔多少毫秒需要触发一次事件，默认200毫秒
 * @return {loop}
 */
export const throttle = (func: Function, delay: number= 300): Function=> {
  let timer: any = null;
  let startTime: number = Date.now();
  return function loop(...args) {
    const curTime: number = Date.now();
    const remaining: number = delay - (curTime - startTime);
    const context: any = this;
    clearTimeout(timer);
    if (remaining <= 0) {
      func.apply(context, args);
      startTime = Date.now();
    } else {
      timer = setTimeout(() => func.apply(context, args), remaining);
    }
  };
};

/**
 * 加锁包装函数(与防抖和节流函数类似)
 * 当有方法同时多次调用，但是只希望调用这个方法一次但未执行完成时，可以使用此包装函数
 * @param func Function 传入函数
 * @param onLockFunc Function 当被锁函数没运行完成时触发的函数
 * @return {Function}
 */
export const lockWrap = (func: Function, onLockFunc: Function): Function => {
  let lock: boolean = false;
  return async function handler(...args) {
    if (!lock) {
      lock = true;
      const result = await func.apply(this, args);
      lock = false;
      return result;
    }
    onLockFunc && onLockFunc.call(this);
  };
};

/**
 * 获取字符url查询数据
 * 参数 [url] 没有参数使用当前url进行解析，有参数时解析的为给出的参数
 * 返回值 {object} 返回一个查询字符串解析的key，value对对象，没有则返回空对象
 */
export const urlParse = (search: string = window.location.search): Dictionary<string> => {
  const obj: Dictionary<string> = {};
  const searchReg: RegExp = /[?&]?\w+=[^?&#]+/g;
  const res: string[] = search.match(searchReg) || [];
  res.forEach((kv: string) => {
    const [key, val] = kv.substr(1).split('=');
    obj[key] = val;
  });
  return obj;
};

// 排除指定参数后返回指定字段
export const getOtherQuery = (query: any = {}, excludes: string[] = ['code']) =>
  Object.keys(query).reduce((acc: Dictionary<string>, cur: string) => {
    if (excludes.indexOf(cur) === -1) acc[cur] = query[cur];
    return acc;
  }, {});

// 路径查询对象使用&字符串拼合
export const queryString = (query: any = {}): string =>
  Object.keys(query)
    .reduce((strArr, key) => strArr.concat([`${key}=${query[key]}`]), [])
    .join('&');

// 转换为数字
export const toNumber = (n: any): number => {
  if (isInValidParam(n)) return 0;
  // eslint-disable-next-line
  return isNaN(Number(n)) ? 0 : Number(n);
};

// 是否是地址
export const isUrl = (str: string): boolean => new RegExp(/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?|.+\.(jpg|jpeg|png|gif|bmp)$/).test(str);

// 过滤无效数据；
export const filterTime = (a: number, b: number): number|undefined => {
  return (a > 0 && b > 0 && (a - b) >= 0) ? (a - b) : undefined;
}

// 获得某个范围内的随机数
export const random = (min: number, max?: number): number => {
  if (min !== void 0 && max === void 0) {
    max = min;
    min = 0;
  }
  if (max - min <= 0) return 0;
  return Math.random() * (max - min) + min;
}
