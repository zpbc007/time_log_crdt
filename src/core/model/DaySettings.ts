export type DaySetting = {
  date_since_1970: number;
  target: string;
  review: string;
};

export function toNativeDaySetting({
  date_since_1970,
  target,
  review,
}: DaySetting): DaySetting {
  return TL_CRDT_Native.daySetting.createWithDate_since_1970TargetReview(
    date_since_1970,
    target,
    review
  );
}

export function fromNativeDaySetting({
  date_since_1970,
  target,
  review,
}: DaySetting): DaySetting {
  return {
    date_since_1970,
    target,
    review,
  };
}
