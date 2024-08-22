export type Task = {
  id: string;
  name: string;
  comment: string;
  done: boolean;
  order: number;
  create_date_since_1970: number;
  parentTask?: string;
  checkList?: string;
};

export function toNativeTask({
  id,
  name,
  comment,
  done,
  order,
  create_date_since_1970,
  parentTask,
  checkList,
}: Task): Task {
  return TL_CRDT_Native.task.createWithIdNameCommentDoneOrderCreate_date_since_1970ParentTaskCheckList(
    id,
    name,
    comment,
    done,
    order,
    create_date_since_1970,
    parentTask,
    checkList
  );
}

export function fromNativeTask(task: Task): Task {
  return {
    id: task.id,
    name: task.name,
    comment: task.comment,
    done: task.done,
    order: task.order,
    create_date_since_1970: task.create_date_since_1970,
    parentTask: task.parentTask,
    checkList: task.checkList,
  };
}
