import { Doc } from "yjs";
import { createCheckListService } from "./CheckList.service";
import { createTagService } from "./Tag.service";
import { createTaskService } from "./Task.service";
import { createTaskLogService } from "./TaskLog.service";
import { rootBus } from "../common/eventbus";
export type { CheckListService } from "./CheckList.service";
export * from "./constants";

export function createService(doc: Doc) {
  const checkListService = createCheckListService(doc);
  const tagService = createTagService(doc);
  const taskService = createTaskService(doc);
  const taskLogService = createTaskLogService(doc, rootBus);

  return {
    checkList: checkListService,
    tag: tagService,
    task: taskService,
    taskLog: taskLogService,
  };
}
