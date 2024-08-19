import { Doc } from "yjs";
import { createCheckListService } from "./CheckList.service";
import { createTagService } from "./Tag.service";
export type { CheckListService } from "./CheckList.service";

export function createService(doc: Doc) {
  const checkListService = createCheckListService(doc);
  const tagService = createTagService(doc);

  return {
    checkList: checkListService,
    tag: tagService,
  };
}
