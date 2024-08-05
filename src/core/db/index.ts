import { Doc, YMapEvent } from "yjs";
import { ChecklistTableKey } from "./constants";
import { CheckList } from "@/core/model";

export function createDB(doc: Doc) {
  const checkListMap = doc.getMap<CheckList>(ChecklistTableKey);

  // TODO: 这里应该调用 swift 暴露的方法
  const handleCheckListMapChange = (event: YMapEvent<CheckList>) => {
    // Find out what changed:
    // Option 1: A set of keys that changed
    event.keysChanged; // => Set<strings>
    // Option 2: Compute the differences
    event.changes.keys; // => Map<string, { action: 'add'|'update'|'delete', oldValue: any}>

    // sample code.
    event.changes.keys.forEach((change, key) => {
      if (change.action === "add") {
        console.log(
          `Property "${key}" was added. Initial value: "${checkListMap.get(key)}".`
        );
      } else if (change.action === "update") {
        console.log(
          `Property "${key}" was updated. New value: "${checkListMap.get(key)}". Previous value: "${change.oldValue}".`
        );
      } else if (change.action === "delete") {
        console.log(
          `Property "${key}" was deleted. New value: undefined. Previous value: "${change.oldValue}".`
        );
      }
    });
  };
  checkListMap.observe(handleCheckListMapChange);
  const upsertCheckList = (checkList: CheckList) => {
    checkListMap.set(checkList.id, checkList);
  };
  const deleteCheckList = (id: string) => {
    checkListMap.delete(id);
  };
  const queryAllCheckList = () => {
    return Array.from(checkListMap.values());
  };

  return {
    checkListService: {
      upsertCheckList,
      deleteCheckList,
      queryAllCheckList,
    },
  };
}
