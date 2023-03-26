export default function throttle<T>(
  func: (arg: T) => void,
  wait: number,
  options?: any
) {
  let timeout: any, context: any, args: any, result: any;
  let previous = 0;
  if (!options) options = {};

  const later = function () {
    previous = options.leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };

  const throttled = function (this: any) {
    const _now = Date.now();
    if (!previous && options.leading === false) previous = _now;
    const remaining = wait - (_now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = _now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };

  // throttled.cancel = function () {
  //   clearTimeout(timeout);
  //   previous = 0;
  //   timeout = context = args = null;
  // };

  return throttled;
}
