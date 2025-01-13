export type TLEvent = {
  id: string;
  name: string;
  comment: string;
  archived: boolean;
  create_date_since_1970: number;
  category?: string;
};

export type TLEventWithTagIds = TLEvent & {
  tags: string[];
};

export function toNativeEvent({
  id,
  name,
  comment,
  archived,
  create_date_since_1970,
  category,
}: TLEvent): TLEvent {
  return TL_CRDT_Native.event.createWithIdNameCommentArchivedCreate_date_since_1970Category(
    id,
    name,
    comment,
    archived,
    create_date_since_1970,
    category || ""
  );
}

export function toNativeEventWithTagIds({
  id,
  name,
  comment,
  archived,
  create_date_since_1970,
  category,
  tags,
}: TLEventWithTagIds): TLEventWithTagIds {
  return TL_CRDT_Native.eventWithTags.createWithIdNameCommentArchivedCreate_date_since_1970CategoryTags(
    id,
    name,
    comment,
    archived,
    create_date_since_1970,
    category || "",
    tags
  );
}

export function fromNativeTask(event: TLEvent): TLEvent {
  return {
    id: event.id,
    name: event.name,
    comment: event.comment,
    archived: event.archived,
    create_date_since_1970: event.create_date_since_1970,
    category: event.category ? event.category : undefined,
  };
}
