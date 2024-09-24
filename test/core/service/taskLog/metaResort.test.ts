import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { TaskLog } from "../../../../src/core/model";
import {
  CommonResultCode,
  DocSyncEventName,
  Result,
} from "../../../../src/core/common/type";
import { createTaskLogByDateArray } from "../../../utils/tasklog";
import {
  createTaskLogService,
  TaskLogService,
} from "../../../../src/core/service/TaskLog.service";
import { applyUpdateV2, Doc, encodeStateAsUpdateV2 } from "yjs";
import { EventBus } from "../../../../src/core/common/eventbus";
import { formatDate } from "../../../utils/date";

describe("core.service.TaskLogService", () => {
  let taskLogService: TaskLogService;
  let eventbus: EventBus;
  let rootDoc: Doc;

  beforeEach(() => {
    vi.useFakeTimers();
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
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const upsertByDateArray = (
    dateArray: [string, string][],
    upsert: (taskLog: TaskLog) => Result<string>,
    idPrefix: string = "id"
  ) => {
    const taskLogs = createTaskLogByDateArray(dateArray, idPrefix, true);
    taskLogs.forEach(item => upsert(item));
  };

  it("should resort meta after sync", async () => {
    // prepare env
    const remoteDoc = new Doc();
    const remoteTaskLogService = createTaskLogService(
      remoteDoc,
      new EventBus()
    );

    // data
    const localDateArray: [string, string][] = [
      ["2024-05-01", "2024-05-03"],
      ["2024-05-05", "2024-05-07"],
      ["2024-05-09", "2024-05-11"],
    ];
    const remoteDateArray: [string, string][] = [
      ["2024-04-15", "2024-04-17"],
      ["2024-04-19", "2024-05-02"],
      ["2024-05-08", "2024-05-12"],
      ["2024-05-14", "2024-05-16"],
    ];

    // op
    upsertByDateArray(localDateArray, taskLogService.upsert, "local");
    upsertByDateArray(remoteDateArray, remoteTaskLogService.upsert, "remote");

    const remoteUpdate = encodeStateAsUpdateV2(remoteDoc);
    applyUpdateV2(rootDoc, remoteUpdate);
    eventbus.emit(DocSyncEventName);

    await vi.advanceTimersByTimeAsync(500);

    const taskLogsResult = taskLogService.queryTaskLogsByDateRange(
      new Date("2024-04-15").getTime(),
      new Date("2024-05-14").getTime()
    );

    expect(taskLogsResult.code).toBe(CommonResultCode.success);
    expect(
      taskLogsResult.data.map(item =>
        formatDate(new Date(item.start_date_since_1970))
      )
    ).toEqual(
      [...localDateArray, ...remoteDateArray]
        .map(item => new Date(item[0]).getTime())
        .sort((a, b) => a - b)
        .map(item => formatDate(new Date(item)))
    );
  });
});
