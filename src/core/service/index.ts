import { Doc } from "yjs";
import { createCheckListService } from "./CheckList.service";
import { createTagService } from "./Tag.service";
import { createTaskService } from "./Task.service";
import { createTaskLogService } from "./TaskLog.service";
import { rootBus } from "../common/eventbus";
export type { CheckListService } from "./CheckList.service";
export * from "./constants";
import { createDaySettingService } from "./DaySetting.service";

export function createService(doc: Doc, disableChangeNotify: boolean) {
  const checkListService = createCheckListService(doc, disableChangeNotify);
  const tagService = createTagService(doc, disableChangeNotify);
  const taskService = createTaskService(doc, disableChangeNotify);
  const taskLogService = createTaskLogService(
    doc,
    rootBus,
    disableChangeNotify
  );
  const daySettingService = createDaySettingService(doc, disableChangeNotify);

  return {
    checkList: checkListService,
    tag: tagService,
    task: taskService,
    taskLog: taskLogService,
    daySetting: daySettingService,
  };
}
