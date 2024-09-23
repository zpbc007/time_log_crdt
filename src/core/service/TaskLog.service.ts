import { Doc } from "yjs";
import { CommonResultCode, DocSyncEventName, Result } from "../common/type";
import {
  fromNativeTaskLog,
  TaskLog,
  toNativeTaskLog,
  TaskLogMeta,
} from "../model";
import {
  RecordingTaskLogTableKey,
  RecordingTaskLogValueKey,
  TaskLogMetaTableKey,
  TaskLogTableKey,
} from "./constants";
import { binarySearchForYArray } from "../common/helper";
import { EventBus } from "../common/eventbus";

export type TaskLogService = {
  start: (
    taskId: string,
    logId: string,
    date_since_1970: number
  ) => Result<void>;
  finish: (date_since_1970: number) => Result<void>;
  queryRecordingTaskLog: () => Result<TaskLog | undefined>;

  upsert: (taskLog: TaskLog) => Result<string>;
  delete: (id: string) => Result<void>;
  queryTaskLogDateRange: () => Result<[number, number] | undefined>;
  queryTaskLogsByDateRange: (
    start_since_1970: number,
    end_since_1970: number
  ) => Result<TaskLog[]>;
};

export enum UpsertCode {
  startDateDuplicate = 100,
  startDateConflict = 101,
  endDateConflict = 102,
}

const resortBatchSize = 50;

export function createTaskLogService(
  doc: Doc,
  eventbus: EventBus,
  disableChangeNotify: boolean = false
): TaskLogService {
  const taskLogMap = doc.getMap<TaskLog>(TaskLogTableKey);
  const taskLogMetaArray = doc.getArray<TaskLogMeta>(TaskLogMetaTableKey);
  const recordingTaskLogMap = doc.getMap<TaskLog>(RecordingTaskLogTableKey);

  if (!disableChangeNotify) {
    taskLogMap.observe(() => {
      TL_CRDT_Native.taskLog.notifyChange();
    });
    recordingTaskLogMap.observe(() => {
      TL_CRDT_Native.taskLog.notifyRecordingChange();
    });
  }

  const processResort = async () => {
    let i = 1;
    while (i < taskLogMetaArray.length) {
      doc.transact(() => {
        processBatchResort(i, resortBatchSize);
      });
      await Promise.resolve();
      i += resortBatchSize;
    }
  };

  const processBatchResort = (from: number, batchSize: number) => {
    const right = from + batchSize;
    while (from < taskLogMetaArray.length && from < right) {
      if (
        taskLogMetaArray.get(from).start_date_since_1970 <
        taskLogMetaArray.get(from - 1).start_date_since_1970
      ) {
        resort(from);
      }

      from++;
    }
  };

  const resort = (index: number) => {
    const resortMeta = taskLogMetaArray.get(index);
    if (!resortMeta) {
      return;
    }

    taskLogMetaArray.delete(index);
    const searchResult = binarySearchForYArray(
      taskLogMetaArray,
      meta => meta.start_date_since_1970 - resortMeta.start_date_since_1970
    );

    const targetIndex =
      searchResult.result !== -1 ? searchResult.result : searchResult.left;
    taskLogMetaArray.insert(targetIndex, [{ ...resortMeta }]);
  };

  // 同步文档后，需要重新排序
  eventbus.on(DocSyncEventName, processResort);

  function getPreMeta(
    currentIndex: number,
    currentId: string
  ): TaskLogMeta | undefined {
    if (currentIndex == 0) {
      return undefined;
    }

    const target = taskLogMetaArray.get(currentIndex - 1);
    if (target && target.id == currentId) {
      return getPreMeta(currentIndex - 1, currentId);
    }

    return target;
  }

  function getNextMeta(
    currentIndex: number,
    currentId: string
  ): TaskLogMeta | undefined {
    const target = taskLogMetaArray.get(currentIndex);
    if (target && target.id == currentId) {
      return getNextMeta(currentIndex + 1, currentId);
    }

    return target;
  }

  const start: TaskLogService["start"] = (taskId, logId, date_since_1970) => {
    const oldRecordingTaskLog = recordingTaskLogMap.get(
      RecordingTaskLogValueKey
    );

    if (oldRecordingTaskLog) {
      // 有正在记录中的任务，先结束
      upsert({
        ...oldRecordingTaskLog,
        end_date_since_1970: date_since_1970,
      });
    }

    recordingTaskLogMap.set(RecordingTaskLogValueKey, {
      id: logId,
      task: taskId,
      comment: "",
      start_date_since_1970: date_since_1970,
      end_date_since_1970: date_since_1970,
    });

    return {
      code: CommonResultCode.success,
    };
  };

  const finish: TaskLogService["finish"] = date_since_1970 => {
    const taskLog = recordingTaskLogMap.get(RecordingTaskLogValueKey);

    if (!taskLog) {
      return {
        code: CommonResultCode.success,
      };
    }
    upsert({
      ...taskLog,
      end_date_since_1970: date_since_1970,
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
      data: taskLog ? toNativeTaskLog(taskLog) : undefined,
    };
  };

  const upsert: TaskLogService["upsert"] = taskLog => {
    taskLog = fromNativeTaskLog(taskLog);

    const searchResult = binarySearchForYArray(
      taskLogMetaArray,
      meta => meta.start_date_since_1970 - taskLog.start_date_since_1970,
      item => item.id == taskLog.id
    );

    // 有一样的 start date
    if (searchResult.result !== -1) {
      return {
        code: UpsertCode.startDateDuplicate,
        data: taskLogMetaArray.get(searchResult.result).id,
      };
    }

    const prevMeta = getPreMeta(searchResult.left, taskLog.id);
    // startDate 与前一个冲突
    if (
      prevMeta &&
      taskLog.start_date_since_1970 < prevMeta.end_date_since_1970
    ) {
      return {
        code: UpsertCode.startDateConflict,
        data: prevMeta.id,
      };
    }

    // endDate 与后一个冲突
    const nextMeta = getNextMeta(searchResult.left, taskLog.id);
    if (
      nextMeta &&
      taskLog.end_date_since_1970 > nextMeta.start_date_since_1970
    ) {
      return {
        code: UpsertCode.endDateConflict,
        data: nextMeta.id,
      };
    }

    const oldTaskLog = taskLogMap.get(taskLog.id);
    let oldIndex = -1;
    if (oldTaskLog) {
      oldIndex = binarySearchForYArray(
        taskLogMetaArray,
        meta => meta.start_date_since_1970 - oldTaskLog.start_date_since_1970
      ).result;
    }

    doc.transact(() => {
      // 先删除
      if (oldIndex !== -1) {
        taskLogMetaArray.delete(oldIndex);
      }

      // 再添加
      taskLogMetaArray.insert(
        oldIndex == -1
          ? searchResult.left // 添加
          : oldIndex < searchResult.left // 更新
            ? searchResult.left - 1
            : searchResult.left,
        [
          {
            id: taskLog.id,
            start_date_since_1970: taskLog.start_date_since_1970,
            end_date_since_1970: taskLog.end_date_since_1970,
          },
        ]
      );
    });
    taskLogMap.set(taskLog.id, taskLog);

    return {
      code: CommonResultCode.success,
      data: "",
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

  const queryTaskLogsByDateRange: TaskLogService["queryTaskLogsByDateRange"] = (
    start_since_1970,
    end_since_1970
  ) => {
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
          data: targetTaskLog ? [toNativeTaskLog(targetTaskLog)] : [],
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
        .map(meta => {
          const taskLog = taskLogMap.get(meta.id);

          return taskLog ? toNativeTaskLog(taskLog) : undefined;
        })
        .filter(taskLog => taskLog) as TaskLog[],
    };
  };

  // 加载后主动排序一次
  processResort();

  return {
    start,
    finish,
    queryRecordingTaskLog,

    upsert,
    delete: deleteFunc,
    queryTaskLogDateRange,
    queryTaskLogsByDateRange,
  };
}
