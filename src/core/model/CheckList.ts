export type CheckList = {
  id: string;
  create_date_since_1970: number;
  name: string;
  colorHex: string;
};

export function toNativeCheckList(checkList: CheckList): CheckList {
  return TL_CRDT_Native.checkList.createWithIdNameColorHexCreate_date_since_1970(
    checkList.id,
    checkList.name,
    checkList.colorHex,
    checkList.create_date_since_1970
  );
}

export function fromNativeCheckList(checkList: CheckList): CheckList {
  return {
    id: checkList.id,
    name: checkList.name,
    colorHex: checkList.colorHex,
    create_date_since_1970: checkList.create_date_since_1970,
  };
}
