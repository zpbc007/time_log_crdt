export type DaySetting = {
  date_since_1970: number;
  target: string;
  targetEvents: string[];
  review: string;
  status: string;
};

export function toNativeDaySetting({
  date_since_1970,
  target,
  targetEvents,
  review,
  status,
}: DaySetting): DaySetting {
  return TL_CRDT_Native.daySetting.createWithDate_since_1970TargetTargetEventsReviewStatus(
    date_since_1970,
    target,
    targetEvents,
    review,
    status
  );
}

export function fromNativeDaySetting({
  date_since_1970,
  target,
  targetEvents,
  review,
  status,
}: DaySetting): DaySetting {
  return {
    date_since_1970,
    target,
    targetEvents,
    review,
    status,
  };
}
