import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CommonResultCode } from "../../../../src/core/common/type";
import {
  createTaskLogService,
  TaskLogService,
} from "../../../../src/core/service/TaskLog.service";
import { Doc } from "yjs";
import { EventBus } from "../../../../src/core/common/eventbus";

describe("core.service.TaskLogService.queryRecordingTaskLog", () => {
  let taskLogService: TaskLogService;
  let eventbus: EventBus;
  let rootDoc: Doc;

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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("queryRecordingTaskLog should return undefined before start", () => {
    const result = taskLogService.queryRecordingTaskLog();

    expect(result.code).toEqual(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(result.data).toBeUndefined();
  });

  it("queryRecordingTaskLog should return log after start", () => {
    taskLogService.start("task-1", "taskLog-1", Date.now());
    const result = taskLogService.queryRecordingTaskLog();

    expect(result.code).toEqual(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(result.data.id).toEqual("taskLog-1");
  });

  it("queryRecordingTaskLog should return undefined after finish", () => {
    taskLogService.start("task-1", "taskLog-1", Date.now());
    taskLogService.finish(Date.now());
    const result = taskLogService.queryRecordingTaskLog();

    expect(result.code).toEqual(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(result.data).toBeUndefined();
  });
});
