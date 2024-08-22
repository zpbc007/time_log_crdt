import { Doc } from "yjs";
import { Tag, Task } from "../model";
import { Tag2TaskTableKey, Task2TagTableKey } from "./constants";
import { difference } from "../common/helper";

export type TaskTagRelationService = {
  upsert: (taskId: string, tagIds: string[]) => void;
  queryTagsByTask: (taskId: string) => Tag["id"][];
  queryTasksByTag: (tagId: string) => Task["id"][];
  deleteTask: (taskId: string) => void;
  deleteTags: (tagIds: string[]) => void;
};

export function createTaskTagRelationService(doc: Doc): TaskTagRelationService {
  const task2tagsMap = doc.getMap<string[]>(Task2TagTableKey);
  const tag2tasksMap = doc.getMap<string[]>(Tag2TaskTableKey);

  const upsert: TaskTagRelationService["upsert"] = (taskId, tagIds) => {
    const oldTagIds = task2tagsMap.get(taskId) || [];
    task2tagsMap.set(taskId, [...tagIds]);

    // 新添加的 tag
    const addTags = difference(tagIds, oldTagIds);
    addTags.forEach(tagId => {
      tag2tasksMap.set(tagId, [...(tag2tasksMap.get(tagId) || []), taskId]);
    });

    // 被移除的 tag
    const delTags = difference(oldTagIds, tagIds);
    delTags.forEach(tagId => {
      const idSet = new Set(tag2tasksMap.get(tagId));
      idSet.delete(taskId);

      if (idSet.size == 0) {
        tag2tasksMap.delete(tagId);
      } else {
        tag2tasksMap.set(tagId, Array.from(idSet));
      }
    });
  };

  const deleteTask: TaskTagRelationService["deleteTask"] = taskId => {
    task2tagsMap.delete(taskId);

    Array.from(tag2tasksMap).forEach(([tagId, taskIds]) => {
      const idSet = new Set(taskIds);
      idSet.delete(taskId);

      if (idSet.size == 0) {
        tag2tasksMap.delete(tagId);
      } else {
        tag2tasksMap.set(tagId, Array.from(idSet));
      }
    });
  };

  const deleteTags: TaskTagRelationService["deleteTags"] = tagIds => {
    tagIds.forEach(tagId => {
      tag2tasksMap.delete(tagId);

      Array.from(task2tagsMap).forEach(([taskId, tagIds]) => {
        if (!tagIds.includes(tagId)) {
          return;
        }

        const idSet = new Set(tagIds);
        idSet.delete(tagId);

        if (idSet.size == 0) {
          task2tagsMap.delete(taskId);
        } else {
          task2tagsMap.set(taskId, Array.from(idSet));
        }
      });
    });
  };

  const queryTagsByTask: TaskTagRelationService["queryTagsByTask"] = taskId => {
    const tagIds = task2tagsMap.get(taskId);
    return tagIds || [];
  };

  const queryTasksByTag: TaskTagRelationService["queryTasksByTag"] = tagId => {
    const taskIds = tag2tasksMap.get(tagId);
    return taskIds || [];
  };

  return { upsert, deleteTask, deleteTags, queryTagsByTask, queryTasksByTag };
}
