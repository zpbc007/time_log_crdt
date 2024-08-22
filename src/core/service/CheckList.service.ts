import { Doc } from "yjs";
import { ChecklistTableKey } from "./constants";
import { CheckList, fromNativeCheckList, toNativeCheckList } from "../model";
import { CommonResultCode, Result } from "../common/type";
import { createTaskInnerService } from "./Task.service";

export type CheckListService = {
  queryAll: () => Result<CheckList[]>;
  upsert: (item: CheckList) => Result<void>;
  delete: (id: string) => Result<void>;
};

export function createCheckListService(doc: Doc): CheckListService {
  const taskInnerService = createTaskInnerService(doc);
  const checkListMap = doc.getMap<CheckList>(ChecklistTableKey);

  const queryAll: CheckListService["queryAll"] = () => {
    return {
      data: Array.from(checkListMap.values()).map(toNativeCheckList),
      code: CommonResultCode.success,
    };
  };

  const upsert: CheckListService["upsert"] = (checkList: CheckList) => {
    checkListMap.set(checkList.id, fromNativeCheckList(checkList));

    return {
      code: CommonResultCode.success,
    };
  };

  const deleteFunc: CheckListService["delete"] = (id: string) => {
    checkListMap.delete(id);
    taskInnerService.removeCheckListInfo(id);

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
