export type Tag = {
  id: string;
  name: string;
};

export function toNativeTag(tag: Tag): Tag {
  return TL_CRDT_Native.tag.createWithIdName(tag.id, tag.name);
}

export function fromNativeTag(tag: Tag): Tag {
  return {
    id: tag.id,
    name: tag.name,
  };
}
