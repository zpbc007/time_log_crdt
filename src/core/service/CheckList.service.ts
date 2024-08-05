import { Doc } from "yjs";
import { ChecklistTableKey } from "../db/constants";
import { CheckList } from "../model";

export type CheckListService = {
  queryAll: () => CheckList[];
  upsert: (item: CheckList) => void;
  delete: (id: string) => void;
};

export function createCheckListService(
  doc: Doc,
  onChangeListener: (_: CheckList[]) => void
): CheckListService {
  const checkListMap = doc.getMap<CheckList>(ChecklistTableKey);

  const queryAll = () => {
    return Array.from(checkListMap.values());
  };

  checkListMap.observe(() => {
    onChangeListener(queryAll());
  });

  return {
    queryAll,
    upsert: (item: CheckList) => {
      checkListMap.set(item.id, item);
    },
    delete: (id: string) => {
      checkListMap.delete(id);
    },
  };
}
