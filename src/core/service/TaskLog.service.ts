import { Doc } from "yjs";
import { CommonResultCode, Result } from "../common/type";
import { fromNativeTaskLog, TaskLog } from "../model";
import {
  RecordingTaskLogTableKey,
  RecordingTaskLogValueKey,
  TaskLogMetaTableKey,
  TaskLogTableKey,
} from "./constants";
import { TaskLogMeta } from "../model/TaskLog";
import { binarySearchForYArray } from "../common/helper";

export type TaskLogService = {
  start: (taskId: string, logId: string) => Result<void>;
  finish: () => Result<void>;
  queryRecordingTaskLog: () => Result<TaskLog | undefined>;

  updateComment: (logId: string, comment: string) => Result<void>;
  upsert: (taskLog: TaskLog) => Result<number>;
  delete: (id: string) => Result<void>;
  queryTaskLogDateRange: () => Result<[Date, Date] | undefined>;
  queryTaskLogInfoByDateRange: (
    start_since_1970: number,
    end_since_1970: number
  ) => Result<TaskLog[]>;
};

export enum UpsertCode {
  startDateDuplicate = 100,
  startDateConflict = 101,
  endDateConflict = 102,
}

export enum FinishCode {
  noRecordingLog = 100,
}

export enum UpdateCommentCode {
  noLog = 100,
}

export function createTaskLogService(doc: Doc): TaskLogService {
  const taskLogMap = doc.getMap<TaskLog>(TaskLogTableKey);
  const taskLogMetaArray = doc.getArray<TaskLogMeta>(TaskLogMetaTableKey);
  const recordingTaskLogMap = doc.getMap<TaskLog>(RecordingTaskLogTableKey);

  taskLogMap.observe(() => {
    TL_CRDT_Native.taskLog.notifyChange();
  });
  recordingTaskLogMap.observe(() => {
    TL_CRDT_Native.taskLog.notifyRecordingChange();
  });

  const start: TaskLogService["start"] = (taskId: string, logId: string) => {
    const oldRecordingTaskLog = recordingTaskLogMap.get(
      RecordingTaskLogValueKey
    );
    const now = Date.now();

    if (oldRecordingTaskLog) {
      // 有正在记录中的任务，先结束
      upsert({
        ...oldRecordingTaskLog,
        end_date_since_1970: now,
      });
    }

    recordingTaskLogMap.set(RecordingTaskLogValueKey, {
      id: logId,
      task: taskId,
      comment: "",
      start_date_since_1970: now,
      end_date_since_1970: now,
    });

    return {
      code: CommonResultCode.success,
    };
  };

  const finish: TaskLogService["finish"] = () => {
    const taskLog = recordingTaskLogMap.get(RecordingTaskLogValueKey);
    if (!taskLog) {
      return {
        code: FinishCode.noRecordingLog,
      };
    }
    const now = Date.now();
    upsert({
      ...taskLog,
      end_date_since_1970: now,
    });
    recordingTaskLogMap.delete(RecordingTaskLogValueKey);

    return {
      code: CommonResultCode.success,
    };
  };

  const queryRecordingTaskLog: TaskLogService["queryRecordingTaskLog"] = () => {
    const taskLog = recordingTaskLogMap.get(RecordingTaskLogValueKey);

    return {
      code: CommonResultCode.success,
      data: taskLog,
    };
  };

  const updateComment: TaskLogService["updateComment"] = (logId, comment) => {
    const targetTaskLog = taskLogMap.get(logId);
    if (!targetTaskLog) {
      return {
        code: UpdateCommentCode.noLog,
      };
    }

    taskLogMap.set(logId, {
      ...targetTaskLog,
      comment: comment,
    });

    return {
      code: CommonResultCode.success,
    };
  };

  const upsert: TaskLogService["upsert"] = taskLog => {
    taskLog = fromNativeTaskLog(taskLog);

    const searchResult = binarySearchForYArray(
      taskLogMetaArray,
      meta => meta.start_date_since_1970 - taskLog.start_date_since_1970
    );

    // 有一样的 start date
    if (searchResult.result !== -1) {
      return {
        code: UpsertCode.startDateDuplicate,
        data: taskLogMetaArray.get(searchResult.result).start_date_since_1970,
      };
    }

    const prevMeta =
      searchResult.left === 0
        ? undefined
        : taskLogMetaArray.get(searchResult.left - 1);

    // startDate 与前一个冲突
    if (
      prevMeta &&
      taskLog.start_date_since_1970 < prevMeta.end_date_since_1970
    ) {
      return {
        code: UpsertCode.startDateConflict,
        data: prevMeta.end_date_since_1970,
      };
    }

    // endDate 与后一个冲突
    const nextMeta = taskLogMetaArray.get(searchResult.left);
    if (
      nextMeta &&
      taskLog.end_date_since_1970 > nextMeta.start_date_since_1970
    ) {
      return {
        code: UpsertCode.endDateConflict,
        data: nextMeta.start_date_since_1970,
      };
    }

    taskLogMetaArray.insert(searchResult.left, [
      {
        id: taskLog.id,
        start_date_since_1970: taskLog.start_date_since_1970,
        end_date_since_1970: taskLog.end_date_since_1970,
      },
    ]);
    taskLogMap.set(taskLog.id, taskLog);

    return {
      code: CommonResultCode.success,
      data: 0,
    };
  };

  const deleteFunc: TaskLogService["delete"] = id => {
    const targetIndex = taskLogMetaArray
      .toArray()
      .findIndex(item => item.id === id);

    if (targetIndex !== -1) {
      taskLogMetaArray.delete(targetIndex);
    }
    taskLogMap.delete(id);

    return {
      code: CommonResultCode.success,
    };
  };

  const queryTaskLogDateRange: TaskLogService["queryTaskLogDateRange"] = () => {
    if (taskLogMetaArray.length === 0) {
      return {
        code: CommonResultCode.success,
        data: undefined,
      };
    }

    if (taskLogMetaArray.length === 1) {
      const meta = taskLogMetaArray.get(0);

      return {
        code: CommonResultCode.success,
        data: [meta.start_date_since_1970, meta.end_date_since_1970],
      };
    }

    const first = taskLogMetaArray.get(0);
    const last = taskLogMetaArray.get(taskLogMetaArray.length - 1);

    return {
      code: CommonResultCode.success,
      data: [first.start_date_since_1970, last.end_date_since_1970],
    };
  };

  const queryTaskLogInfoByDateRange: TaskLogService["queryTaskLogInfoByDateRange"] =
    (start_since_1970, end_since_1970) => {
      const emptyResult: Result<TaskLog[]> = {
        code: CommonResultCode.success,
        data: [],
      };

      if (taskLogMetaArray.length === 0) {
        return emptyResult;
      }

      const startIndex = binarySearchForYArray(taskLogMetaArray, meta => {
        return meta.end_date_since_1970 - start_since_1970;
      }).left;
      // 超出范围
      if (startIndex >= taskLogMetaArray.length) {
        return emptyResult;
      }

      const endIndex = binarySearchForYArray(taskLogMetaArray, meta => {
        return meta.start_date_since_1970 - end_since_1970;
      }).left;
      if (endIndex === 0) {
        const targetMeta = taskLogMetaArray.get(endIndex);
        if (targetMeta.end_date_since_1970 <= end_since_1970) {
          const targetTaskLog = taskLogMap.get(targetMeta.id);
          return {
            code: CommonResultCode.success,
            data: targetTaskLog ? [targetTaskLog] : [],
          };
        } else {
          // 超出范围
          return emptyResult;
        }
      }

      return {
        code: CommonResultCode.success,
        data: taskLogMetaArray
          .slice(
            startIndex,
            endIndex === taskLogMetaArray.length - 1 ? endIndex + 1 : endIndex
          )
          .map(meta => taskLogMap.get(meta.id))
          .filter(taskLog => taskLog) as TaskLog[],
      };
    };

  return {
    start,
    finish,
    queryRecordingTaskLog,

    updateComment,
    upsert,
    delete: deleteFunc,
    queryTaskLogDateRange,
    queryTaskLogInfoByDateRange,
  };
}