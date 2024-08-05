import { Color } from "./Color";

export type CheckList = {
  id: string;
  createDate: number;
  name: string;
  color: Color;
};

export function initCheckList(
  id: string,
  createDate: number,
  name: string,
  color: Color
): CheckList {
  return {
    id,
    createDate,
    name,
    color,
  };
}
