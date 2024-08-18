import { Doc } from "yjs";
import { createCheckListService } from "./CheckList.service";
export type { CheckListService } from "./CheckList.service";

export function createService(doc: Doc) {
  const checkListService = createCheckListService(doc);

  return {
    checkList: checkListService,
  };
}
