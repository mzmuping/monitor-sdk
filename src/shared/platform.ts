// 获取userAgent
export const getUserAgent = () => window.navigator.userAgent.toLowerCase();

// 验证userAgent
export const testUa = (regexp: RegExp): boolean => regexp.test(getUserAgent());
// 严重版本
export const testVs = (regexp: RegExp): string => (getUserAgent().match(regexp) + '').replace(/[^0-9|_.]/ig, '').replace(/_/ig, '.');

export const NONE = 'none'
export const UNKNOWN = 'unknown'
// 操作系统
export const OS_WINDOWS = 'Windows';
export const OS_OSX = 'OSX';
export const OS_LINUX = 'Linux';
export const OS_ANDROID = 'Android';
export const OS_IOS = 'iOS';
// 内核
export const ENGINE_WEBKIT = 'Webkit';
export const ENGINE_GECKO = 'Gecko';
export const ENGINE_PRESTO = 'Presto';
export const ENGINE_TRIDENT = 'Trident';
// 载体
export const SUPPORTER_EDGE = 'Edge';
export const SUPPORTER_OPERA = 'Opera';
export const SUPPORTER_CHROME = 'Chrome';
export const SUPPORTER_SAFARI = 'Safari';
export const SUPPORTER_FIREFOX = 'Firefox';
export const SUPPORTER_IEXPLORE = 'Iexplore';
// 浏览器外壳
export const SHELL_WECHAT = 'Wechat';
export const SHELL_QQ = 'QQ';
export const SHELL_UC = 'UC';
export const SHELL_2345 = '2345';
export const SHELL_SOUGOU = 'Sougou';
export const SHELL_LIEBAO = 'liebao';
export const SHELL_MAXTHON = 'maxthon';
export const SHELL_BAIDU = 'baidu';

export const getOs = (): string => {
  let system = UNKNOWN;
  if (testUa(/windows|win32|win64|wow32|wow64/ig)) {
   system = OS_WINDOWS; // window系统
  } else if (testUa(/macintosh|macintel/ig)) {
   system = OS_OSX; // osx系统
  } else if (testUa(/x11/ig)) {
   system = OS_LINUX; // linux系统
  } else if (testUa(/android|adr/ig)) {
   system = OS_ANDROID; // android系统
  } else if (testUa(/ios|iphone|ipad|ipod|iwatch/ig)) {
   system = OS_IOS; // ios系统
  }
  return system;
}

export const getOsVersion = (): string => {
  let systemVs = UNKNOWN;
  const system = getOs();
  if (system === OS_WINDOWS) {
    if (testUa(/windows nt 5.0|windows 2000/ig)) {
      systemVs = '2000';
    } else if (testUa(/windows nt 5.1|windows xp/ig)) {
      systemVs = 'xp';
    } else if (testUa(/windows nt 5.2|windows 2003/ig)) {
      systemVs = '2003';
    } else if (testUa(/windows nt 6.0|windows vista/ig)) {
      systemVs = 'vista';
    } else if (testUa(/windows nt 6.1|windows 7/ig)) {
      systemVs = '7';
    } else if (testUa(/windows nt 6.2|windows 8/ig)) {
      systemVs = '8';
    } else if (testUa(/windows nt 6.3|windows 8.1/ig)) {
      systemVs = '8.1';
    } else if (testUa(/windows nt 10.0|windows 10/ig)) {
      systemVs = '10';
    }
  } else if (system === OS_OSX) {
    systemVs = testVs(/os x [\d._]+/ig);
  } else if (system === OS_ANDROID) {
    systemVs = testVs(/android [\d._]+/ig);
  } else if (system === OS_IOS) {
    systemVs = testVs(/os [\d._]+/ig);
  }
  return systemVs;
}

export const getPlatform = (): string => {
  let platform = UNKNOWN;
  const system = getOs();
  if (system === OS_WINDOWS || system === OS_OSX || system === OS_LINUX) {
    platform = 'PC'; // 桌面端
  } else if (system === OS_ANDROID || system === OS_IOS || testUa(/mobile/ig)) {
    platform = 'Mobile'; // 移动端
  }
  return platform;
}

export const getEngine = (): {
  engine: string,
  supporter: string,
  engineAndSupporterStr: string
} => {
  let engine = UNKNOWN;
  let supporter = UNKNOWN;
  if (testUa(/applewebkit/ig) && testUa(/safari/ig)) {
    engine = ENGINE_WEBKIT; // webkit内核
  if (testUa(/edge/ig)) {
    supporter = SUPPORTER_EDGE; // edge浏览器
  } else if (testUa(/opr/ig)) {
    supporter = SUPPORTER_OPERA; // opera浏览器
  } else if (testUa(/chrome/ig)) {
    supporter = SUPPORTER_CHROME; // chrome浏览器
  } else {
    supporter = SUPPORTER_SAFARI; // safari浏览器
  }
  } else if (testUa(/gecko/ig) && testUa(/firefox/ig)) {
    engine = ENGINE_GECKO; // gecko内核
    supporter = SUPPORTER_FIREFOX; // firefox浏览器
  } else if (testUa(/presto/ig)) {
    engine = ENGINE_PRESTO; // presto内核
    supporter = SUPPORTER_OPERA; // opera浏览器
  } else if (testUa(/trident|compatible|msie/ig)) {
    engine = ENGINE_TRIDENT; // trident内核
    supporter = SUPPORTER_IEXPLORE; // iexplore浏览器
  }
  return { engine, supporter, engineAndSupporterStr: `Engine:${engine} Supporter:${supporter}` }
}

export const getEngineVersion = (): string => {
  // 内核版本
  let engineVs = UNKNOWN;
  // 载体版本
  let supporterVs = UNKNOWN;
  const { engine, supporter } = getEngine();

  if (engine === ENGINE_WEBKIT) {
    engineVs = testVs(/applewebkit\/[\d.]+/ig);
  } else if (engine === ENGINE_GECKO) {
    engineVs = testVs(/gecko\/[\d.]+/ig);
  } else if (engine === ENGINE_PRESTO) {
    engineVs = testVs(/presto\/[\d.]+/ig);
  } else if (engine === ENGINE_TRIDENT) {
    engineVs = testVs(/trident\/[\d.]+/ig);
  }

  if (supporter === SUPPORTER_CHROME) {
    supporterVs = testVs(/chrome\/[\d.]+/ig);
  } else if (supporter === SUPPORTER_SAFARI) {
    supporterVs = testVs(/version\/[\d.]+/ig);
  } else if (supporter === SUPPORTER_FIREFOX) {
    supporterVs = testVs(/firefox\/[\d.]+/ig);
  } else if (supporter === SUPPORTER_OPERA) {
    supporterVs = testVs(/opr\/[\d.]+/ig);
  } else if (supporter === SUPPORTER_IEXPLORE) {
    supporterVs = testVs(/(msie [\d.]+)|(rv:[\d.]+)/ig);
  } else if (supporter === SUPPORTER_EDGE) {
    supporterVs = testVs(/edge\/[\d.]+/ig);
  }
  return `EngineVersion:${engineVs} SupporterVersion:${supporterVs}`
}

export const getShell = (): string => {
  let shell = NONE;
  let shellVs = UNKNOWN;
  if (testUa(/micromessenger/ig)) {
    shell = SHELL_WECHAT; // 微信浏览器
    shellVs = testVs(/micromessenger\/[\d.]+/ig);
  } else if (testUa(/qqbrowser/ig)) {
    shell = SHELL_QQ; // QQ浏览器
    shellVs = testVs(/qqbrowser\/[\d.]+/ig);
  } else if (testUa(/ubrowser/ig)) {
    shell = SHELL_UC; // UC浏览器
    shellVs = testVs(/ubrowser\/[\d.]+/ig);
  } else if (testUa(/2345explorer/ig)) {
    shell = SHELL_2345; // 2345浏览器
    shellVs = testVs(/2345explorer\/[\d.]+/ig);
  } else if (testUa(/metasr/ig)) {
    shell = SHELL_SOUGOU; // 搜狗浏览器
  } else if (testUa(/lbbrowser/ig)) {
    shell = SHELL_LIEBAO; // 猎豹浏览器
  } else if (testUa(/maxthon/ig)) {
    shell = SHELL_MAXTHON; // 遨游浏览器
    shellVs = testVs(/maxthon\/[\d.]+/ig);
  } else if (testUa(/bidubrowser/ig)) {
    shell = SHELL_BAIDU; // 百度浏览器
    shellVs = testVs(/bidubrowser [\d.]+/ig);
  }
  return `Shell:${shell} ShellVersion: ${shellVs}`;
}

// 是否是移动端环境
export const isMobile = () => /android|webos|iphone|ipod|blackberry/i.test(getUserAgent());

export const os = getOs();
export const osVersion = getOsVersion();
export const platform = getPlatform();
export const engine = getEngine().engineAndSupporterStr;
export const engineVersion = getEngineVersion();
export const shell = getShell();

