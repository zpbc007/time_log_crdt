import { Doc } from "yjs";
import { CategoryTableKey } from "./constants";
import { Category, fromNativeCategory, toNativeCategory } from "../model";
import { CommonResultCode, Result } from "../common/type";
import { createTaskInnerService } from "./Event.service";

export type CategoryService = {
  queryAll: () => Result<Category[]>;
  upsert: (item: Category) => Result<void>;
  delete: (id: string) => Result<void>;
};

export function createCategoryService(
  doc: Doc,
  disableChangeNotify: boolean
): CategoryService {
  const taskInnerService = createTaskInnerService(doc);
  const categoryMap = doc.getMap<Category>(CategoryTableKey);

  if (!disableChangeNotify) {
    categoryMap.observe(() => {
      TL_CRDT_Native.category.notifyChange();
    });
  }

  const queryAll: CategoryService["queryAll"] = () => {
    return {
      data: Array.from(categoryMap.values()).map(toNativeCategory),
      code: CommonResultCode.success,
    };
  };

  const upsert: CategoryService["upsert"] = (category: Category) => {
    categoryMap.set(category.id, fromNativeCategory(category));

    return {
      code: CommonResultCode.success,
    };
  };

  const deleteFunc: CategoryService["delete"] = (id: string) => {
    categoryMap.delete(id);
    taskInnerService.removeCategoryInfo(id);

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
