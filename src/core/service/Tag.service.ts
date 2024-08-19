import { Doc } from "yjs";
import { CommonResultCode, Result } from "../common/type";
import { Tag } from "../model";
import { TagTableKey } from "./constants";

export type TagService = {
  queryAll: () => Result<Tag[]>;
  upsert: (items: [Tag]) => Result<void>;
  delete: (ids: [string]) => Result<void>;
};

export function createTagService(doc: Doc): TagService {
  const tagMap = doc.getMap<Tag>(TagTableKey);

  const queryAll: TagService["queryAll"] = () => {
    return {
      data: Array.from(tagMap.values()).map(({ id, name }) => {
        return TL_CRDT_Native.tag.createWithIdName(id, name);
      }),
      code: CommonResultCode.success,
    };
  };

  const upsert: TagService["upsert"] = tags => {
    tags.forEach(tag => {
      tagMap.set(tag.id, { id: tag.id, name: tag.name });
    });

    return {
      code: CommonResultCode.success,
    };
  };

  const deleteFunc: TagService["delete"] = ids => {
    ids.forEach(id => {
      tagMap.delete(id);
    });

    return {
      code: CommonResultCode.success,
    };
  };

  tagMap.observe(() => {
    TL_CRDT_Native.tag.notifyChange();
  });

  return {
    queryAll,
    upsert,
    delete: deleteFunc,
  };
}
