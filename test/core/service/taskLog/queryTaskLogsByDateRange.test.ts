import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  createTaskLogService,
  TaskLogService,
} from "../../../../src/core/service/TaskLog.service";
import { EventBus } from "../../../../src/core/common/eventbus";
import { Doc } from "yjs";
import { CommonResultCode } from "../../../../src/core/common/type";
import { TaskLog } from "../../../../src/core/model";
import { createTaskLogByDateArray } from "../../../utils/tasklog";

describe("core.service.TaskLogService.queryTaskLogsByDateRange", () => {
  let taskLogService: TaskLogService;
  let eventbus: EventBus;
  let rootDoc: Doc;
  let taskLogs: TaskLog[];

  beforeEach(() => {
    vi.stubGlobal("TL_CRDT_Native", {
      logger: {
        log: console.log,
      },
      taskLog: {
        notifyChange: vi.fn(),
        notifyRecordingChange: vi.fn(),
        createWithIdTaskCommentStart_date_since_1970End_date_since_1970: (
          id: string,
          task: string,
          comment: string,
          start_date_since_1970: number,
          end_date_since_1970: number | null
        ) => {
          return {
            id,
            task,
            comment,
            start_date_since_1970,
            end_date_since_1970: end_date_since_1970 || Date.now(),
          };
        },
      },
    });

    rootDoc = new Doc();
    eventbus = new EventBus();
    taskLogService = createTaskLogService(rootDoc, eventbus);
    taskLogs = createTaskLogByDateArray(
      [
        ["2024-05-01 07:00", "2024-05-01 08:00"],
        ["2024-05-01 08:30", "2024-05-01 09:30"],
        ["2024-05-01 10:00", "2024-05-01 11:00"],
        ["2024-05-01 11:30", "2024-05-01 12:30"],
        ["2024-05-01 13:00", "2024-05-01 14:00"],
        ["2024-05-01 15:00", "2024-05-01 16:00"],
        ["2024-05-01 17:00", "2024-05-01 18:00"],

        ["2024-05-02 07:00", "2024-05-02 08:00"],
        ["2024-05-02 08:30", "2024-05-02 09:30"],
        ["2024-05-02 10:00", "2024-05-02 11:00"],
        ["2024-05-02 11:30", "2024-05-02 12:30"],
        ["2024-05-02 13:00", "2024-05-02 14:00"],
        ["2024-05-02 15:00", "2024-05-02 16:00"],
        ["2024-05-02 17:00", "2024-05-02 18:00"],

        ["2024-05-03 07:00", "2024-05-03 08:00"],
        ["2024-05-03 08:30", "2024-05-03 09:30"],
        ["2024-05-03 10:00", "2024-05-03 11:00"],
        ["2024-05-03 11:30", "2024-05-03 12:30"],
        ["2024-05-03 13:00", "2024-05-03 14:00"],
        ["2024-05-03 15:00", "2024-05-03 16:00"],
        ["2024-05-03 17:00", "2024-05-03 18:00"],

        ["2024-05-04 07:00", "2024-05-04 08:00"],
        ["2024-05-04 08:30", "2024-05-04 09:30"],
        ["2024-05-04 10:00", "2024-05-04 11:00"],
        ["2024-05-04 11:30", "2024-05-04 12:30"],
        ["2024-05-04 13:00", "2024-05-04 14:00"],
        ["2024-05-04 15:00", "2024-05-04 16:00"],
        ["2024-05-04 17:00", "2024-05-04 18:00"],
      ],
      "id",
      false
    );
    taskLogs.forEach(item => taskLogService.upsert(item));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("在所有 taskLog 日期之前的查询，应该查不到", () => {
    const result = taskLogService.queryTaskLogsByDateRange(
      new Date("2024-04-30 00:00").getTime(),
      new Date("2024-05-01 06:59").getTime()
    );

    expect(result.code).toEqual(CommonResultCode.success);
    expect(result.data.length).toEqual(0);
  });

  it("在所有 taskLog 日期之后的查询，应该查不到", () => {
    const result = taskLogService.queryTaskLogsByDateRange(
      new Date("2024-05-04 18:01").getTime(),
      new Date("2024-05-04 23:59").getTime()
    );

    expect(result.code).toEqual(CommonResultCode.success);
    expect(result.data.length).toEqual(0);
  });

  it("在日期范围内，应该能够查询到", () => {
    const result = taskLogService.queryTaskLogsByDateRange(
      new Date("2024-05-02 09:59").getTime(),
      new Date("2024-05-03 16:01").getTime()
    );

    expect(result.code).toEqual(CommonResultCode.success);
    expect(result.data.length).toEqual(11);
  });

  it("只包含最后一个", () => {
    const result = taskLogService.queryTaskLogsByDateRange(
      new Date("2024-05-04 17:00").getTime(),
      new Date("2024-05-04 18:01").getTime()
    );

    expect(result.code).toEqual(CommonResultCode.success);
    expect(result.data.length).toEqual(1);
  });

  it("不包含最后一个", () => {
    const result = taskLogService.queryTaskLogsByDateRange(
      new Date("2024-05-04 07:00").getTime(),
      new Date("2024-05-04 16:30").getTime()
    );

    expect(result.code).toEqual(CommonResultCode.success);
    expect(result.data.length).toEqual(6);
  });
});
