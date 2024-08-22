import { Doc } from "yjs";
import { CommonResultCode, Result } from "../common/type";
import { fromNativeTag, Tag, toNativeTag } from "../model";
import { TagTableKey } from "./constants";
import { createTaskTagRelationService } from "./TaskTagRelation.service";

export type TagService = {
  queryAll: () => Result<Tag[]>;
  upsert: (items: [Tag]) => Result<void>;
  delete: (ids: [string]) => Result<void>;
};

export function createTagService(doc: Doc): TagService {
  const tagMap = doc.getMap<Tag>(TagTableKey);
  const taskTagRelationService = createTaskTagRelationService(doc);

  tagMap.observe(() => {
    TL_CRDT_Native.tag.notifyChange();
  });

  const queryAll: TagService["queryAll"] = () => {
    return {
      data: Array.from(tagMap.values()).map(toNativeTag),
      code: CommonResultCode.success,
    };
  };

  const upsert: TagService["upsert"] = tags => {
    tags.forEach(tag => {
      tagMap.set(tag.id, fromNativeTag(tag));
    });

    return {
      code: CommonResultCode.success,
    };
  };

  const deleteFunc: TagService["delete"] = ids => {
    ids.forEach(id => {
      tagMap.delete(id);
    });
    taskTagRelationService.deleteTags(ids);

    return {
      code: CommonResultCode.success,
    };
  };

  return {
    queryAll,
    upsert,
    delete: deleteFunc,
  };
}
