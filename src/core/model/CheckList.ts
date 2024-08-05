import { Color } from "./Color";

export class CheckList {
  id: string;
  createDate: Date;
  name: string;
  color: Color;

  constructor(id: string, createDate: Date, name: string, color: Color) {
    this.id = id;
    this.createDate = createDate;
    this.name = name;
    this.color = color;
  }

  toJSON() {
    return {
      id: this.id,
      createDate: this.createDate.getTime(),
      name: this.name,
      color: this.color.toJSON(),
    };
  }
}
