import { FDStateInfo } from '.';
import { debounce } from 'src/shared/utils';

export type StrategyHandler = (stateInfo: FDStateInfo, cb: Function) => void;

/**
 * 上报策略
 */
export type Strategy = {
  strategyName: string;
  handler: StrategyHandler;
};

// 默认策略列表
export let Strategys: Strategy[] = [
  {
    // 时间轮询，10分钟触发一次
    strategyName: 'timeLoop',
    handler: debounce(
      (stateInfo, cb) => stateInfo.recodEventList.length > 1 && cb(),
      1000 * 60 * 10 /* 10分钟上报一次 */
    ) as StrategyHandler,
  },
  {
    // 容量检查，记录数大于100条就触发
    strategyName: 'capacityInspect',
    handler: (stateInfo, cb) => stateInfo.recodEventList.length > 100 && cb(),
  },
];

// 清除上传策略
export const clearUploadStrategys = () => Strategys = [];
// 添加上传策略
export const addUploadStrategy = (strategy: Strategy) => Strategys.push(strategy);
// 修改上报策略
export const modifyUploadStrategy = (strategyName: string, handler: StrategyHandler) => {
  const strategy = Strategys.find((sy: Strategy) => sy.strategyName === strategyName);
  if (strategy) strategy.handler = handler;
}

// 策略匹配
const StrategyMatch = (stateInfo: FDStateInfo, cb: Function) =>
  Strategys.forEach((strategy: Strategy) => strategy.handler(stateInfo, cb));

export default StrategyMatch;
