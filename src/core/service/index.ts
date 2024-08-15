import { Doc } from "yjs";
import { createCheckListService } from "./CheckList.service";
export type { CheckListService } from "./CheckList.service";

export function createService(doc: Doc) {
  const checkListService = createCheckListService(doc, newCheckLists => {
    TL_CRDT_Native.logger.log(`get new checkLists: ${newCheckLists}`);
  });

  return {
    checkList: checkListService,
  };
}
