export class Color {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number, g: number, b: number, a: number) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  toJSON() {
    return {
      r: this.r,
      g: this.g,
      b: this.b,
      a: this.a,
    };
  }
}
