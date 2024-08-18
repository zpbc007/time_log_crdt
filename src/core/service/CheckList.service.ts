import { Doc } from "yjs";
import { ChecklistTableKey } from "./constants";
import { CheckList } from "../model";
import { CommonResultCode, Result } from "../common/type";

export type CheckListService = {
  queryAll: () => Result<CheckList[]>;
  upsert: (item: CheckList) => Result<void>;
  delete: (id: string) => Result<void>;
};

export function createCheckListService(doc: Doc): CheckListService {
  const checkListMap = doc.getMap<CheckList>(ChecklistTableKey);

  const queryAll: CheckListService["queryAll"] = () => {
    return {
      data: Array.from(checkListMap.values()).map(
        ({ id, name, create_date_since_1970, colorHex }) => {
          return TL_CRDT_Native.checkList.createWithIdNameColorHexCreate_date_since_1970(
            id,
            name,
            colorHex,
            create_date_since_1970
          );
        }
      ),
      code: CommonResultCode.success,
    };
  };

  const upsert: CheckListService["upsert"] = ({
    id,
    name,
    create_date_since_1970,
    colorHex,
  }: CheckList) => {
    checkListMap.set(id, {
      id,
      name,
      create_date_since_1970,
      colorHex,
    });

    return {
      code: CommonResultCode.success,
    };
  };

  const deleteFunc: CheckListService["delete"] = (id: string) => {
    checkListMap.delete(id);

    return {
      code: CommonResultCode.success,
    };
  };

  checkListMap.observe(() => {
    TL_CRDT_Native.checkList.notifyChange();
  });

  return {
    queryAll,
    upsert,
    delete: deleteFunc,
  };
}
