import { Doc } from "yjs";
import { createCategoryService } from "./Category.service";
import { createTagService } from "./Tag.service";
import { createEventService } from "./Event.service";
import { createTaskLogService } from "./TaskLog.service";
import { rootBus } from "../common/eventbus";
export type { CategoryService } from "./Category.service";
export * from "./constants";
import { createDaySettingService } from "./DaySetting.service";

export function createService(doc: Doc, disableChangeNotify: boolean) {
  const categoryService = createCategoryService(doc, disableChangeNotify);
  const tagService = createTagService(doc, disableChangeNotify);
  const eventService = createEventService(doc, disableChangeNotify);
  const taskLogService = createTaskLogService(
    doc,
    rootBus,
    disableChangeNotify
  );
  const daySettingService = createDaySettingService(doc, disableChangeNotify);

  return {
    category: categoryService,
    tag: tagService,
    event: eventService,
    taskLog: taskLogService,
    daySetting: daySettingService,
  };
}
