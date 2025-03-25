import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createDaySettingService,
  DaySettingService,
} from "../../../src/core/service/DaySetting.service";
import { Doc } from "yjs";
import { CommonResultCode } from "../../../src/core/common/type";

describe("core.service.DaySetting.service", () => {
  let daySettingService: DaySettingService;
  let notifyChange;
  let rootDoc: Doc;

  beforeEach(() => {
    notifyChange = vi.fn();

    vi.stubGlobal("TL_CRDT_Native", {
      daySetting: {
        notifyChange,
        createWithDate_since_1970TargetTargetEventsReviewStatus: (
          date_since_1970,
          target,
          targetEvents,
          review,
          status
        ) => ({
          date_since_1970,
          target,
          targetEvents,
          review,
          status,
        }),
      },
    });

    rootDoc = new Doc();
    daySettingService = createDaySettingService(rootDoc, false);
  });

  it("upsert should work", () => {
    const result = daySettingService.upsert({
      date_since_1970: Date.now(),
      target: "",
      targetEvents: [],
      review: "",
      status: "",
    });

    expect(result.code).toBe(CommonResultCode.success);
  });

  it("query not exist setting should return undefined", () => {
    const result = daySettingService.queryByDate(Date.now());

    expect(result.code).toBe(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(result.data).toBe(undefined);
  });

  it("query should return target setting", () => {
    const date = Date.now();
    daySettingService.upsert({
      date_since_1970: date,
      target: "target",
      review: "review",
      status: "status",
    });
    const queryResult = daySettingService.queryByDate(date);
    expect(queryResult.code).toBe(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(queryResult.data.target).toEqual("target");
    // @ts-expect-error should has data
    expect(queryResult.data.review).toEqual("review");
    // @ts-expect-error should has data
    expect(queryResult.data.status).toEqual("status");
  });

  it("upsertTarget should create model", () => {
    const date = Date.now();

    daySettingService.upsertTarget(date, "target");
    const queryResult = daySettingService.queryByDate(date);

    expect(queryResult.code).toBe(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(queryResult.data.target).toEqual("target");
    // @ts-expect-error should has data
    expect(queryResult.data.review).toEqual("");
  });

  it("upsertTarget should update model", () => {
    const date = Date.now();
    daySettingService.upsert({
      date_since_1970: Date.now(),
      target: "old_target",
      targetEvents: ["old_event"],
      review: "old_review",
      status: "old_status",
    });

    daySettingService.upsertTarget(date, "new_target");

    const queryResult = daySettingService.queryByDate(date);
    expect(queryResult.code).toBe(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(queryResult.data.target).toEqual("new_target");
    // @ts-expect-error should has data
    expect(queryResult.data.review).toEqual("old_review");
    // @ts-expect-error should has data
    expect(queryResult.data.status).toEqual("old_status");
  });
});
