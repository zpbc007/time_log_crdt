import { Doc } from "yjs";
import { ChecklistTableKey } from "./constants";
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
    return Array.from(checkListMap.values()).map(
      ({ id, name, create_date_since_1970, colorHex }) => {
        return TL_CRDT_Native.checkList.createWithIdNameColorHexCreate_date_since_1970(
          id,
          name,
          colorHex,
          create_date_since_1970
        );
      }
    );
  };

  checkListMap.observe(() => {
    onChangeListener(queryAll());
  });

  return {
    queryAll,
    upsert: ({ id, name, create_date_since_1970, colorHex }: CheckList) => {
      checkListMap.set(id, {
        id,
        name,
        create_date_since_1970,
        colorHex,
      });
    },
    delete: (id: string) => {
      checkListMap.delete(id);
    },
  };
}
