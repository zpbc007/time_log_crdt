export type TLEvent = {
  id: string;
  name: string;
  comment: string;
  archived: boolean;
  create_date_since_1970: number;
  checkList?: string;
};

export function toNativeEvent({
  id,
  name,
  comment,
  archived,
  create_date_since_1970,
  checkList,
}: TLEvent): TLEvent {
  return TL_CRDT_Native.event.createWithIdNameCommentArchivedCreate_date_since_1970CheckList(
    id,
    name,
    comment,
    archived,
    create_date_since_1970,
    checkList || ""
  );
}

export function fromNativeTask(event: TLEvent): TLEvent {
  return {
    id: event.id,
    name: event.name,
    comment: event.comment,
    archived: event.archived,
    create_date_since_1970: event.create_date_since_1970,
    checkList: event.checkList ? event.checkList : undefined,
  };
}
