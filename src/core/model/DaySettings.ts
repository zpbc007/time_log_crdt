export type DaySetting = {
  date_since_1970: number;
  target: string;
  review: string;
  status: string;
};

export function toNativeDaySetting({
  date_since_1970,
  target,
  review,
  status,
}: DaySetting): DaySetting {
  return TL_CRDT_Native.daySetting.createWithDate_since_1970TargetReviewStatus(
    date_since_1970,
    target,
    review,
    status
  );
}

export function fromNativeDaySetting({
  date_since_1970,
  target,
  review,
  status,
}: DaySetting): DaySetting {
  return {
    date_since_1970,
    target,
    review,
    status,
  };
}
