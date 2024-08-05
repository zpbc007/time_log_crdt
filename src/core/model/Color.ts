export type Color = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export function initColor(r: number, g: number, b: number, a: number): Color {
  return {
    r,
    g,
    b,
    a,
  };
}
