export type Result<T> = T extends void
  ? { code: number }
  : { code: number; data: T };

export enum CommonResultCode {
  success = 1,
  fail = 0,
}
