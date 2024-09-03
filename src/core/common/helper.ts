import { YArray } from "yjs/dist/src/internals";

/**
 * 返回在 A 中存在，但在 B 中不存在的值
 * a = [1, 2, 3, 4, 5], b = [5, 2, 10], output: [1, 3, 4];
 */
export function difference<T>(a: T[], b: T[]): T[] {
  return a.filter(value => !b.includes(value));
}

function _binarySearch<T>(
  left: number,
  right: number,
  valueGetter: (index: number) => T,
  compare: (a: T) => number
) {
  let result = -1; // 如果未找到元素，初始化结果为-1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const compareResult = compare(valueGetter(mid));
    if (compareResult === 0) {
      // 找到目标元素，返回下标
      result = mid;
      break;
    } else if (compareResult < 0) {
      // 如果目标元素大于中间元素，则在右侧查找
      left = mid + 1;
    } else {
      // 如果目标元素小于中间元素，则在左侧查找
      right = mid - 1;
    }
  }

  return { result, left };
}

export function binarySearchForYArray<T>(
  arr: YArray<T>,
  compare: (a: T) => number
) {
  if (arr.length === 0) {
    return {
      result: -1,
      left: 0,
    };
  }

  return _binarySearch(0, arr.length - 1, index => arr.get(index), compare);
}

export function binarySearch<T>(arr: T[], compare: (a: T) => number) {
  if (arr.length === 0) {
    return {
      result: -1,
      left: 0,
    };
  }
  return _binarySearch(0, arr.length - 1, index => arr[index], compare);
}

export function isSameDay(date1: Date, date2: Date): boolean {
  // 获取两个日期的年份、月份和日期
  const year1 = date1.getFullYear();
  const month1 = date1.getMonth();
  const day1 = date1.getDate();

  const year2 = date2.getFullYear();
  const month2 = date2.getMonth();
  const day2 = date2.getDate();

  // 比较年份、月份和日期
  return year1 === year2 && month1 === month2 && day1 === day2;
}
