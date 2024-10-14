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
        createWithDate_since_1970TargetReview: ({
          date_since_1970,
          target,
          review,
        }) => ({
          date_since_1970,
          target,
          review,
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
      review: "",
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
    });
    const queryResult = daySettingService.queryByDate(date);
    expect(queryResult.code).toBe(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(queryResult.data.target).toEqual("target");
    // @ts-expect-error should has data
    expect(queryResult.data.review).toEqual("review");
  });
});
