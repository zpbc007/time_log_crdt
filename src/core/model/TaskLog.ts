export type TaskLog = {
  id: string;
  task: string;
  comment: string;
  start_date_since_1970: number;
  end_date_since_1970: number;
};

export type TaskLogMeta = {
  id: string;
  start_date_since_1970: number;
  end_date_since_1970: number;
};

export function toNativeTaskLog({
  id,
  task,
  comment,
  start_date_since_1970,
  end_date_since_1970,
}: TaskLog): TaskLog {
  return TL_CRDT_Native.taskLog.createWithIdTaskCommentStart_date_since_1970End_date_since_1970(
    id,
    task,
    comment,
    start_date_since_1970,
    end_date_since_1970
  );
}

export function fromNativeTaskLog(taskLog: TaskLog): TaskLog {
  return {
    id: taskLog.id,
    task: taskLog.task,
    comment: taskLog.comment,
    start_date_since_1970: taskLog.start_date_since_1970,
    end_date_since_1970: taskLog.end_date_since_1970,
  };
}
