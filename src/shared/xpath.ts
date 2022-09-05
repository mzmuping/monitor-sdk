// 获取元素xpath
const getXpath = (element) => {
  if (!(element instanceof Element)) return '';
  // 判断id属性，如果这个元素有id，则显 示//*[@id="xPath"]  形式内容
  if (element.id !== '') {
    return '//*[@id=\"' + element.id + '\"]';
  }
  // 因为Xpath属性不止id，所以还可以更具体的形式添加属性

  // 递归到body处，结束递归
  if (element === document.body) {
    return '/html/' + element.tagName.toLowerCase();
  }

  //在nodelist中的位置，且每次点击初始化
  let ix = 0;
  const siblings = element.parentNode.childNodes; //同级的子元素

  for (let i = 0, l = siblings.length; i < l; i++) {
    const el: Element = siblings[i] as Element;
    // 如果这个元素是siblings数组中的元素，则执行递归操作
    if (el === element) {
      // ix+1是因为xpath是从1开始计数的，element.tagName+((ix+1)==1?'':'['+(ix+1)+']')三元运算符，如果是第一个则不显示，从2开始显示
      return getXpath(element.parentNode) + '/' + element.tagName.toLowerCase() + ((ix + 1) == 1 ? '' : '[' + (ix + 1) + ']');
    // 如果不符合，判断是否是element元素，并且是否是相同元素，如果是相同的就开始累加
    } else if (el.nodeType == 1 && el.tagName == element.tagName) {
      ix++;
    }
  }
};

export default getXpath;
