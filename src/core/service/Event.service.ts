import { Doc } from "yjs";
import { CommonResultCode, Result } from "../common/type";
import { fromNativeTask, Tag, TLEvent, toNativeEvent } from "../model";
import { EventTableKey } from "./constants";
import { createTaskTagRelationService } from "./TaskTagRelation.service";
import { TLEventWithTagIds, toNativeEventWithTagIds } from "../model/Event";

export type EventService = {
  queryAll: (includeArchived: boolean) => Result<TLEvent[]>;
  queryAllWithTagIds: (includeArchived: boolean) => Result<TLEventWithTagIds[]>;
  queryById: (id: string) => Result<TLEvent | undefined>;
  queryByIdWithTagIds: (id: string) => Result<TLEventWithTagIds | undefined>;
  queryByIds: (ids: string[]) => Result<TLEvent[]>;
  queryByCategory: (
    categoryID: string | null,
    includeDone: boolean
  ) => Result<TLEvent[]>;
  queryByCategoryWithTagIds: (
    categoryID: string | null,
    includeDone: boolean
  ) => Result<TLEventWithTagIds[]>;
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

  function addTag2Event(event: TLEvent) {
    const tags = taskTagRelationService.queryTagsByTask(event.id);
    return toNativeEventWithTagIds({
      ...event,
      tags,
    });
  }

  const queryAllWithTagIds: EventService["queryAllWithTagIds"] =
    includeArchived => {
      const result: TLEventWithTagIds[] = Array.from(taskMap.values()).reduce<
        TLEventWithTagIds[]
      >((acc, item) => {
        if (!includeArchived && item.archived) {
          return acc;
        }

        acc.push(addTag2Event(item));
        return acc;
      }, []);

      return {
        data: result.map(toNativeEventWithTagIds),
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

  const queryByIdWithTagIds: EventService["queryByIdWithTagIds"] = id => {
    const targetTask = taskMap.get(id);

    return {
      data: targetTask ? addTag2Event(targetTask) : null,
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

  function filterByCategory(
    event: TLEvent,
    categoryID: string | null,
    includeArchived: boolean
  ): boolean {
    let result = true;
    if (!categoryID || categoryID.length == 0) {
      result = result && !event.category;
    } else {
      result = result && event.category == categoryID;
    }
    if (!includeArchived) {
      result = result && !event.archived;
    }

    return result;
  }

  const queryByCategory: EventService["queryByCategory"] = (
    categoryID,
    includeArchived
  ) => {
    const data = Array.from(taskMap.values())
      .filter(item => {
        return filterByCategory(item, categoryID, includeArchived);
      })
      .map(toNativeEvent);

    return {
      data,
      code: CommonResultCode.success,
    };
  };

  const queryByCategoryWithTagIds: EventService["queryByCategoryWithTagIds"] = (
    categoryID,
    includeArchived
  ) => {
    const data = Array.from(taskMap.values()).reduce<TLEventWithTagIds[]>(
      (acc, item) => {
        if (!filterByCategory(item, categoryID, includeArchived)) {
          return acc;
        }
        acc.push(addTag2Event(item));

        return acc;
      },
      []
    );

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
    queryAllWithTagIds,
    queryById,
    queryByIdWithTagIds,
    queryByIds,
    queryByCategory,
    queryByCategoryWithTagIds,
    queryByTag,
    queryByTags,
    queryTags,
    queryTagRelation,
    upsert,
    update,
    delete: deleteFunc,
  };
}
