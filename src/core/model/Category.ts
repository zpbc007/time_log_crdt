export type Category = {
  id: string;
  create_date_since_1970: number;
  name: string;
  colorHex: string;
};

export function toNativeCategory(category: Category): Category {
  return TL_CRDT_Native.category.createWithIdNameColorHexCreate_date_since_1970(
    category.id,
    category.name,
    category.colorHex,
    category.create_date_since_1970
  );
}

export function fromNativeCategory(category: Category): Category {
  return {
    id: category.id,
    name: category.name,
    colorHex: category.colorHex,
    create_date_since_1970: category.create_date_since_1970,
  };
}
