/**
 * 返回在 A 中存在，但在 B 中不存在的值
 * a = [1, 2, 3, 4, 5], b = [5, 2, 10], output: [1, 3, 4];
 */
export function difference<T>(a: T[], b: T[]): T[] {
  return a.filter(value => !b.includes(value));
}
