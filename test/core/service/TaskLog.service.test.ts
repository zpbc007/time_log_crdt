import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";
import { Doc } from "yjs";
import {
  createTaskLogService,
  TaskLogService,
  UpdateCommentCode,
  UpsertCode,
} from "../../../src/core/service/TaskLog.service";
import { CommonResultCode } from "../../../src/core/common/type";
import { TaskLog } from "../../../src/core/model";

describe("core.service.TaskLogService", () => {
  let taskLogService: TaskLogService;
  let notifyChange;
  let notifyRecordingChange;

  beforeEach(() => {
    notifyChange = vi.fn();
    notifyRecordingChange = vi.fn();
    vi.stubGlobal("TL_CRDT_Native", {
      taskLog: {
        notifyChange,
        notifyRecordingChange,
      },
    });

    const rootDoc = new Doc();
    taskLogService = createTaskLogService(rootDoc);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("start should work", () => {
    const result = taskLogService.start("task-1", "taskLog-1");

    expect(result.code).toEqual(CommonResultCode.success);
    expect(notifyRecordingChange).toBeCalledTimes(1);
  });

  it("finish should work", () => {
    taskLogService.start("task-1", "taskLog-1");
    const result = taskLogService.finish();

    expect(result.code).toEqual(CommonResultCode.success);
    expect(notifyChange).toBeCalledTimes(1);
    expect(notifyRecordingChange).toBeCalledTimes(2);
  });

  it("queryRecordingTaskLog should return undefined before start", () => {
    const result = taskLogService.queryRecordingTaskLog();

    expect(result.code).toEqual(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(result.data).toBeUndefined();
  });

  it("queryRecordingTaskLog should return log after start", () => {
    taskLogService.start("task-1", "taskLog-1");
    const result = taskLogService.queryRecordingTaskLog();

    expect(result.code).toEqual(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(result.data.id).toEqual("taskLog-1");
  });

  it("queryRecordingTaskLog should return undefined after finish", () => {
    taskLogService.start("task-1", "taskLog-1");
    taskLogService.finish();
    const result = taskLogService.queryRecordingTaskLog();

    expect(result.code).toEqual(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(result.data).toBeUndefined();
  });

  it("updateComment should return noLog when taskLog is empty", () => {
    const result = taskLogService.updateComment("taskLog-1", "xxx");

    expect(result.code).toEqual(UpdateCommentCode.noLog);
  });

  it("updateComment should success when taskLog exist", () => {
    const start = new Date("2024-05-01").getTime();
    const end = new Date("2024-05-02").getTime();
    taskLogService.upsert({
      id: "taskLog-1",
      task: "task-1",
      comment: "yyy",
      start_date_since_1970: start,
      end_date_since_1970: end,
    });
    const result = taskLogService.updateComment("taskLog-1", "xxx");
    const taskLogs = taskLogService.queryTaskLogInfoByDateRange(start, end);

    expect(result.code).toEqual(CommonResultCode.success);
    expect(taskLogs.data[0].comment).toEqual("xxx");
  });

  it("upsert should return startDateDuplicate when start date same", () => {
    const start = new Date("2024-05-01").getTime();
    const end = new Date("2024-05-02").getTime();

    const taskLog: TaskLog = {
      id: "taskLog-1",
      task: "task-1",
      comment: "xxx",
      start_date_since_1970: start,
      end_date_since_1970: end,
    };

    const firstResult = taskLogService.upsert(taskLog);
    const secondResult = taskLogService.upsert(taskLog);

    expect(firstResult.code).toEqual(CommonResultCode.success);
    expect(secondResult.code).toEqual(UpsertCode.startDateDuplicate);
    expect(secondResult.data).toEqual(start);
  });

  it("upsert should return startDateConflict when start date conflict", () => {
    const start1 = new Date("2024-05-01").getTime();
    const end1 = new Date("2024-05-03").getTime();
    const taskLog1: TaskLog = {
      id: "taskLog-1",
      task: "task-1",
      comment: "xxx",
      start_date_since_1970: start1,
      end_date_since_1970: end1,
    };

    const start2 = new Date("2024-05-02").getTime();
    const end2 = new Date("2024-05-04").getTime();
    const taskLog2: TaskLog = {
      id: "taskLog-2",
      task: "task-1",
      comment: "xxx",
      start_date_since_1970: start2,
      end_date_since_1970: end2,
    };

    taskLogService.upsert(taskLog1);
    const result = taskLogService.upsert(taskLog2);

    expect(result.code).toEqual(UpsertCode.startDateConflict);
    expect(result.data).toEqual(end1);
  });

  it("upsert should return endDateConflict when end date conflict", () => {
    const start1 = new Date("2024-05-01").getTime();
    const end1 = new Date("2024-05-03").getTime();
    const taskLog1: TaskLog = {
      id: "taskLog-1",
      task: "task-1",
      comment: "xxx",
      start_date_since_1970: start1,
      end_date_since_1970: end1,
    };

    const start2 = new Date("2024-04-10").getTime();
    const end2 = new Date("2024-05-02").getTime();
    const taskLog2: TaskLog = {
      id: "taskLog-2",
      task: "task-1",
      comment: "xxx",
      start_date_since_1970: start2,
      end_date_since_1970: end2,
    };

    taskLogService.upsert(taskLog1);
    const result = taskLogService.upsert(taskLog2);

    expect(result.code).toEqual(UpsertCode.endDateConflict);
    expect(result.data).toEqual(start1);
  });

  it("upsert should short taskLog by startDate", () => {
    const taskLog1: TaskLog = {
      id: "taskLog-1",
      task: "task-1",
      comment: "xxx",
      start_date_since_1970: new Date("2024-05-01").getTime(),
      end_date_since_1970: new Date("2024-05-03").getTime(),
    };
    const taskLog2: TaskLog = {
      id: "taskLog-2",
      task: "task-1",
      comment: "xxx",
      start_date_since_1970: new Date("2024-05-04").getTime(),
      end_date_since_1970: new Date("2024-05-06").getTime(),
    };
    const taskLog3: TaskLog = {
      id: "taskLog-3",
      task: "task-1",
      comment: "xxx",
      start_date_since_1970: new Date("2024-05-07").getTime(),
      end_date_since_1970: new Date("2024-05-09").getTime(),
    };

    const result1 = taskLogService.upsert(taskLog3);
    const result2 = taskLogService.upsert(taskLog2);
    const result3 = taskLogService.upsert(taskLog1);
    const taskLogsResult = taskLogService.queryTaskLogInfoByDateRange(
      taskLog1.start_date_since_1970,
      taskLog3.end_date_since_1970
    );

    expect(result1.code).toEqual(CommonResultCode.success);
    expect(result2.code).toEqual(CommonResultCode.success);
    expect(result3.code).toEqual(CommonResultCode.success);
    expect(taskLogsResult.code).toEqual(CommonResultCode.success);
    expect(taskLogsResult.data.map(item => item.id)).toEqual(
      [taskLog1, taskLog2, taskLog3].map(item => item.id)
    );
  });

  it("delete should work", () => {
    const taskLogs: TaskLog[] = [
      [new Date("2024-05-01"), new Date("2024-05-03")],
      [new Date("2024-05-04"), new Date("2024-05-06")],
      [new Date("2024-05-07"), new Date("2024-05-09")],
    ].map(([start, end], index) => {
      return {
        id: `taskLog-${index}`,
        task: "task-1",
        comment: "xxx",
        start_date_since_1970: start.getTime(),
        end_date_since_1970: end.getTime(),
      };
    });

    taskLogs.forEach(item => taskLogService.upsert(item));

    const deleteResult = taskLogService.delete("taskLog-1");
    const taskLogsResult = taskLogService.queryTaskLogInfoByDateRange(
      taskLogs[0].start_date_since_1970,
      taskLogs[2].end_date_since_1970
    );

    expect(deleteResult.code).toEqual(CommonResultCode.success);
    expect(taskLogsResult.data.map(item => item.id)).toEqual(
      [taskLogs[0], taskLogs[2]].map(item => item.id)
    );
  });

  it("queryTaskLogDateRange should return undefined when taskLog empty", () => {
    const result = taskLogService.queryTaskLogDateRange();

    expect(result.code).toEqual(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(result.data).toBeUndefined();
  });

  it("queryTaskLogDateRange should return taskLog date range", () => {
    const taskLogs: TaskLog[] = [
      [new Date("2024-05-01"), new Date("2024-05-03")],
      [new Date("2024-05-04"), new Date("2024-05-06")],
      [new Date("2024-05-07"), new Date("2024-05-09")],
    ].map(([start, end], index) => {
      return {
        id: `taskLog-${index}`,
        task: "task-1",
        comment: "xxx",
        start_date_since_1970: start.getTime(),
        end_date_since_1970: end.getTime(),
      };
    });

    taskLogs.forEach(item => taskLogService.upsert(item));

    const result = taskLogService.queryTaskLogDateRange();

    expect(result.code).toEqual(CommonResultCode.success);
    // @ts-expect-error should has data
    expect(result.data).toEqual([
      taskLogs[0].start_date_since_1970,
      taskLogs[2].end_date_since_1970,
    ]);
  });

  it("queryTaskLogInfoByDateRange should work", () => {
    const taskLogs: TaskLog[] = [
      [new Date("2024-05-01"), new Date("2024-05-03")],
      [new Date("2024-05-04"), new Date("2024-05-06")],
      [new Date("2024-05-07"), new Date("2024-05-09")],
      [new Date("2024-05-10"), new Date("2024-05-12")],
    ].map(([start, end], index) => {
      return {
        id: `taskLog-${index}`,
        task: "task-1",
        comment: "xxx",
        start_date_since_1970: start.getTime(),
        end_date_since_1970: end.getTime(),
      };
    });

    taskLogs.forEach(item => taskLogService.upsert(item));

    // 在所有 taskLog 之前
    const result1 = taskLogService.queryTaskLogInfoByDateRange(
      new Date("2024-04-01").getTime(),
      new Date("2024-04-05").getTime()
    );
    expect(result1.code).toEqual(CommonResultCode.success);
    expect(result1.data.length).toEqual(0);

    // 在所有 taskLog 之后
    const result2 = taskLogService.queryTaskLogInfoByDateRange(
      new Date("2024-06-01").getTime(),
      new Date("2024-06-05").getTime()
    );
    expect(result2.code).toEqual(CommonResultCode.success);
    expect(result2.data.length).toEqual(0);

    // start & end 有部分重叠
    const result3 = taskLogService.queryTaskLogInfoByDateRange(
      new Date("2024-05-01 12:00").getTime(),
      new Date("2024-05-05").getTime()
    );
    expect(result3.code).toEqual(CommonResultCode.success);
    expect(result3.data.length).toEqual(2);
  });
});