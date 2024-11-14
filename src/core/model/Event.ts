export type TLEvent = {
  id: string;
  name: string;
  comment: string;
  done: boolean;
  order: number;
  create_date_since_1970: number;
  parentTask?: string;
  checkList?: string;
};

export function toNativeEvent({
  id,
  name,
  comment,
  done,
  order,
  create_date_since_1970,
  parentTask,
  checkList,
}: TLEvent): TLEvent {
  return TL_CRDT_Native.event.createWithIdNameCommentDoneOrderCreate_date_since_1970ParentTaskCheckList(
    id,
    name,
    comment,
    done,
    order,
    create_date_since_1970,
    parentTask || "",
    checkList || ""
  );
}

export function fromNativeTask(event: TLEvent): TLEvent {
  return {
    id: event.id,
    name: event.name,
    comment: event.comment,
    done: event.done,
    order: event.order,
    create_date_since_1970: event.create_date_since_1970,
    parentTask: event.parentTask ? event.parentTask : undefined,
    checkList: event.checkList ? event.checkList : undefined,
  };
}
