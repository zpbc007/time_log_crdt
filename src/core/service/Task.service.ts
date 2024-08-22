import { Doc } from "yjs";
import { CommonResultCode, Result } from "../common/type";
import { fromNativeTask, Tag, Task, toNativeTask } from "../model";
import { TaskTableKey } from "./constants";
import { createTaskTagRelationService } from "./TaskTagRelation.service";

export type TaskService = {
  queryAll: (includeDone: boolean) => Result<Task[]>;
  queryById: (id: string) => Result<Task | undefined>;
  queryByCheckList: (
    checkListID: string | null,
    includeDone: boolean
  ) => Result<Task[]>;
  queryByTag: (tagId: string, includeDone: boolean) => Result<Task[]>;
  queryTags: (id: string) => Result<Tag["id"][]>;
  upsert: (task: Task, tagIds: string[]) => Result<void>;
  update: (tasks: Task[]) => Result<void>;
  delete: (id: string) => Result<void>;
};

export function createTaskService(doc: Doc): TaskService {
  const taskMap = doc.getMap<Task>(TaskTableKey);
  const taskTagRelationService = createTaskTagRelationService(doc);

  taskMap.observe(() => {
    TL_CRDT_Native.task.notifyChange();
  });

  const queryAll: TaskService["queryAll"] = includeDone => {
    let data = Array.from(taskMap.values());
    if (!includeDone) {
      data = data.filter(item => !item.done);
    }

    return {
      data: data.map(toNativeTask),
      code: CommonResultCode.success,
    };
  };

  const queryById: TaskService["queryById"] = id => {
    const targetTask = taskMap.get(id);

    return {
      data: targetTask ? toNativeTask(targetTask) : null,
      code: CommonResultCode.success,
    };
  };

  const queryByCheckList: TaskService["queryByCheckList"] = (
    checkListID,
    includeDone
  ) => {
    const data = Array.from(taskMap.values())
      .filter(item => {
        let result = true;
        if (!checkListID || checkListID.length == 0) {
          result = result && !item.checkList;
        } else {
          result = result && item.checkList == checkListID;
        }
        if (!includeDone) {
          result = result && !item.done;
        }

        return result;
      })
      .map(toNativeTask);

    return {
      data,
      code: CommonResultCode.success,
    };
  };

  const queryByTag: TaskService["queryByTag"] = (tagId, includeDone) => {
    const taskIds = taskTagRelationService.queryTasksByTag(tagId);
    const data = taskIds
      .map(taskId => taskMap.get(taskId))
      .filter(item => {
        if (!item) {
          return false;
        }

        if (!includeDone) {
          return item.done == false;
        } else {
          return true;
        }
      }) as Task[];

    return {
      data: data.map(toNativeTask),
      code: CommonResultCode.success,
    };
  };

  const queryTags: TaskService["queryTags"] = taskId => {
    const tagIds = taskTagRelationService.queryTagsByTask(taskId);

    return {
      data: tagIds,
      code: CommonResultCode.success,
    };
  };

  const upsert: TaskService["upsert"] = (task, tagIds) => {
    taskMap.set(task.id, fromNativeTask(task));
    taskTagRelationService.upsert(task.id, tagIds);

    return {
      code: CommonResultCode.success,
    };
  };

  const update: TaskService["update"] = tasks => {
    tasks.forEach(task => {
      taskMap.set(task.id, fromNativeTask(task));
    });

    return {
      code: CommonResultCode.success,
    };
  };

  const deleteFunc: TaskService["delete"] = taskId => {
    taskMap.delete(taskId);
    taskTagRelationService.deleteTask(taskId);

    return {
      code: CommonResultCode.success,
    };
  };

  return {
    queryAll,
    queryById,
    queryByCheckList,
    queryByTag,
    queryTags,
    upsert,
    update,
    delete: deleteFunc,
  };
}
