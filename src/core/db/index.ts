import { Doc, encodeStateAsUpdateV2 } from "yjs";
import { createCheckListService } from "../service";

export function createDB(doc: Doc) {
  const save = () => encodeStateAsUpdateV2(doc);
  const checkListService = createCheckListService(doc, newCheckLists => {
    console.log("get new checkLists: ", newCheckLists);
  });

  return {
    checkListService: checkListService,
    save,
  };
}
