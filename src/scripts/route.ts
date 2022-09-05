import { MonitorDataRecod, InitCallback, Dictionary } from '../shared/definition';
import { FDStateInfo } from '../state';
import { getUid, urlParse } from '../shared/utils';

export interface FDRouteData extends MonitorDataRecod {
  preLifeId: string; // 上一次页面打开开始记录唯一标识（如果存在）
  lifeId: string; // 页面打开开始记录唯一标识
  path: string; // 路径
  fullPath: string; // 全路径
  queryObj: Dictionary<string>; // 路径查询字符串
}

export default {
  init(
    path: string = `${location.origin}${location.pathname}`,
    fullPath: string = location.href,
    cb: InitCallback,
    stateInfo: FDStateInfo
  ) {
    const len = stateInfo.routeStack.length;
    const lastRoute = stateInfo.routeStack[len - 1];
    const routeData: FDRouteData = {
      type: "subRoute",
      time: Date.now(),
      preLifeId: lastRoute.lifeId,
      lifeId: getUid(),
      path,
      fullPath,
      queryObj: urlParse(),
    };
    cb(routeData);
  }
}
