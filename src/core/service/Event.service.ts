import { Doc } from "yjs";
import { CommonResultCode, Result } from "../common/type";
import { fromNativeTask, Tag, TLEvent, toNativeEvent } from "../model";
import { EventTableKey } from "./constants";
import { createTaskTagRelationService } from "./TaskTagRelation.service";

export type EventService = {
  queryAll: (includeArchived: boolean) => Result<TLEvent[]>;
  queryById: (id: string) => Result<TLEvent | undefined>;
  queryByIds: (ids: string[]) => Result<TLEvent[]>;
  queryByCategory: (
    categoryID: string | null,
    includeDone: boolean
  ) => Result<TLEvent[]>;
  queryByTag: (tagId: string, includeDone: boolean) => Result<TLEvent[]>;
  queryByTags: (tagIds: string[], includeDone: boolean) => Result<TLEvent[]>;
  queryTags: (id: string) => Result<Tag["id"][]>;
  queryTagRelation: (ids: string[]) => Result<{ [taskId: string]: string[] }>;
  upsert: (task: TLEvent, tagIds: string[]) => Result<void>;
  update: (tasks: TLEvent[]) => Result<void>;
  delete: (id: string) => Result<void>;
};

export type TaskInnerService = {
  removeCategoryInfo: (categoryId: string) => void;
};

export function createTaskInnerService(doc: Doc): TaskInnerService {
  const eventMap = doc.getMap<TLEvent>(EventTableKey);

  const removeCategoryInfo: TaskInnerService["removeCategoryInfo"] =
    categoryId => {
      Array.from(eventMap.values())
        .filter(item => item.category == categoryId)
        .forEach(item => {
          eventMap.set(item.id, {
            ...item,
            category: undefined,
          });
        });
    };

  return {
    removeCategoryInfo: removeCategoryInfo,
  };
}

export function createEventService(
  doc: Doc,
  disableChangeNotify: boolean
): EventService {
  const taskMap = doc.getMap<TLEvent>(EventTableKey);
  const taskTagRelationService = createTaskTagRelationService(doc);

  if (!disableChangeNotify) {
    taskMap.observe(() => {
      TL_CRDT_Native.event.notifyChange();
    });
  }

  const queryAll: EventService["queryAll"] = includeArchived => {
    let data = Array.from(taskMap.values());
    if (!includeArchived) {
      data = data.filter(item => !item.archived);
    }

    return {
      data: data.map(toNativeEvent),
      code: CommonResultCode.success,
    };
  };

  const queryById: EventService["queryById"] = id => {
    const targetTask = taskMap.get(id);

    return {
      data: targetTask ? toNativeEvent(targetTask) : null,
      code: CommonResultCode.success,
    };
  };

  const queryByIdsWithDone = (
    ids: TLEvent["id"][],
    includeArchived: boolean
  ) => {
    return ids.reduce<TLEvent[]>((acc, id) => {
      const task = taskMap.get(id);
      if (!task) {
        return acc;
      }

      if (!includeArchived && task.archived) {
        return acc;
      }

      acc.push(toNativeEvent(task));
      return acc;
    }, []);
  };

  const queryByIds: EventService["queryByIds"] = ids => {
    const tasks = queryByIdsWithDone(ids, true);

    return {
      code: CommonResultCode.success,
      data: tasks,
    };
  };

  const queryByCategory: EventService["queryByCategory"] = (
    categoryID,
    includeArchived
  ) => {
    const data = Array.from(taskMap.values())
      .filter(item => {
        let result = true;
        if (!categoryID || categoryID.length == 0) {
          result = result && !item.category;
        } else {
          result = result && item.category == categoryID;
        }
        if (!includeArchived) {
          result = result && !item.archived;
        }

        return result;
      })
      .map(toNativeEvent);

    return {
      data,
      code: CommonResultCode.success,
    };
  };

  const queryByTag: EventService["queryByTag"] = (tagId, includeDone) => {
    const taskIds = taskTagRelationService.queryTasksByTag(tagId);
    const data = queryByIdsWithDone(taskIds, includeDone);

    return {
      data: data.map(toNativeEvent),
      code: CommonResultCode.success,
    };
  };

  const queryByTags: EventService["queryByTags"] = (tagIds, includeDone) => {
    const taskIds = taskTagRelationService.queryTasksByTags(tagIds);
    const data = queryByIdsWithDone(taskIds, includeDone);

    return {
      data,
      code: CommonResultCode.success,
    };
  };

  const queryTags: EventService["queryTags"] = taskId => {
    const tagIds = taskTagRelationService.queryTagsByTask(taskId);

    return {
      data: tagIds,
      code: CommonResultCode.success,
    };
  };

  const queryTagRelation: EventService["queryTagRelation"] = taskIds => {
    const relation = taskIds.reduce<{ [taskId: string]: string[] }>(
      (acc, taskId) => {
        acc[taskId] = taskTagRelationService.queryTagsByTask(taskId);

        return acc;
      },
      {}
    );

    return {
      code: CommonResultCode.success,
      data: relation,
    };
  };

  const upsert: EventService["upsert"] = (task, tagIds) => {
    taskMap.set(task.id, fromNativeTask(task));
    taskTagRelationService.upsert(task.id, tagIds);

    return {
      code: CommonResultCode.success,
    };
  };

  const update: EventService["update"] = tasks => {
    tasks.forEach(task => {
      taskMap.set(task.id, fromNativeTask(task));
    });

    return {
      code: CommonResultCode.success,
    };
  };

  const deleteFunc: EventService["delete"] = taskId => {
    taskMap.delete(taskId);
    taskTagRelationService.deleteTask(taskId);

    return {
      code: CommonResultCode.success,
    };
  };

  return {
    queryAll,
    queryById,
    queryByIds,
    queryByCategory: queryByCategory,
    queryByTag,
    queryByTags,
    queryTags,
    queryTagRelation,
    upsert,
    update,
    delete: deleteFunc,
  };
}
