type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")}`;
}

/** a と b を t（0〜1）の割合で混ぜる */
export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex([0, 1, 2].map((i) => ca[i] + (cb[i] - ca[i]) * t) as Rgb);
}

export const lighten = (color: string, t: number) => mix(color, "#ffffff", t);
export const darken = (color: string, t: number) => mix(color, "#000000", t);

export function luminance(color: string): number {
  const [r, g, b] = hexToRgb(color);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
