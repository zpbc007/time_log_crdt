import { Doc } from "yjs";
import { createCheckListService } from "./CheckList.service";
import { createTagService } from "./Tag.service";
import { createTaskService } from "./Task.service";
export type { CheckListService } from "./CheckList.service";

export function createService(doc: Doc) {
  const checkListService = createCheckListService(doc);
  const tagService = createTagService(doc);
  const taskService = createTaskService(doc);

  return {
    checkList: checkListService,
    tag: tagService,
    task: taskService,
  };
}
