/**
 * 加法
 */
export const add = (num1: any, num2: any): number => {
  let baseNum1: number;
  let baseNum2: number;
  try {
    baseNum1 = num1.toString().split('.')[1].length;
  } catch (e) {
    baseNum1 = 0;
  }
  try {
    baseNum2 = num2.toString().split('.')[1].length;
  } catch (e) {
    baseNum2 = 0;
  }
  // eslint-disable-next-line no-restricted-properties
  const baseNum = Math.pow(10, Math.max(baseNum1, baseNum2));
  return (num1 * baseNum + num2 * baseNum) / baseNum;
};

/**
 * 减法
 * @param num1被减数
 * @param num2减数
 */
export const subtract = (num1: any, num2: any): number => {
  let baseNum1: number;
  let baseNum2: number;
  try {
    baseNum1 = num1.toString().split('.')[1].length;
  } catch (e) {
    baseNum1 = 0;
  }
  try {
    baseNum2 = num2.toString().split('.')[1].length;
  } catch (e) {
    baseNum2 = 0;
  }
  // eslint-disable-next-line no-restricted-properties
  const baseNum = Math.pow(10, Math.max(baseNum1, baseNum2));
  return (num1 * baseNum - num2 * baseNum) / baseNum;
};

/**
 * 乘法
 * @param num1被乘数
 * @param num2乘数
 */
export const multiply = (num1: any, num2: any): number => {
  let baseNum: number = 0;
  try {
    baseNum += num1.toString().split('.')[1].length;
    // eslint-disable-next-line no-empty
  } catch (e) {}
  try {
    baseNum += num2.toString().split('.')[1].length;
    // eslint-disable-next-line no-empty
  } catch (e) {}
  // eslint-disable-next-line no-restricted-properties
  return Number(num1.toString().replace('.', '')) * Number(num2.toString().replace('.', '')) / Math.pow(10, baseNum);
};


/**
 * 除法
 * @param num1被除数
 * @param num2除数
 */
export const divide = (num1: any, num2: any): number => {
  let baseNum1: number = 0;
  let baseNum2: number = 0;
  try {
    baseNum1 = num1.toString().split('.')[1].length;
  } catch (e) {
    baseNum1 = 0;
  }
  try {
    baseNum2 = num2.toString().split('.')[1].length;
  } catch (e) {
    baseNum2 = 0;
  }
  const baseNum3 = Number(num1.toString().replace('.', ''));
  const baseNum4 = Number(num2.toString().replace('.', ''));
  // eslint-disable-next-line no-restricted-properties
  return (baseNum3 / baseNum4) * Math.pow(10, baseNum2 - baseNum1);
};
