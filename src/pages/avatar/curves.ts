export type Point = [number, number];

const round = (n: number) => Math.round(n * 100) / 100;
const fmt = ([x, y]: Point) => `${round(x)} ${round(y)}`;

/** Catmull-Rom スプラインの 1 区間上の点 */
function catmullRom(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  const at = (i: 0 | 1) =>
    0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3);
  return [at(0), at(1)];
}

/** 点を滑らかにつなぐ曲線（Catmull-Rom スプラインを 3 次ベジェ曲線で表したもの）の path */
export function spline(points: Point[], closed = false): string {
  const n = points.length;
  const get = (i: number) => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${fmt(points[0])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [get(i - 1), get(i), get(i + 1), get(i + 2)];
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
  }
  return closed ? `${d} Z` : d;
}

/** 点を通る滑らかな曲線上に、細かく点を打つ */
export function sampleSpline(points: Point[], perSegment = 8): Point[] {
  const n = points.length;
  const get = (i: number) => points[Math.max(0, Math.min(n - 1, i))];
  const result: Point[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < perSegment; j++) {
      result.push(catmullRom(get(i - 1), get(i), get(i + 1), get(i + 2), j / perSegment));
    }
  }
  result.push(points[n - 1]);
  return result;
}

/**
 * 中心線に沿って太さが変わる線（筆で描いたような線）の輪郭。
 * width は中心線の始点を 0、終点を 1 としたときの太さ
 */
export function brush(center: Point[], width: (t: number) => number): string {
  const points = sampleSpline(center);
  const left: Point[] = [];
  const right: Point[] = [];
  points.forEach((p, i) => {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const length = Math.hypot(dx, dy) || 1;
    const half = width(i / (points.length - 1)) / 2;
    const [nx, ny] = [-dy / length, dx / length];
    left.push([p[0] + nx * half, p[1] + ny * half]);
    right.push([p[0] - nx * half, p[1] - ny * half]);
  });
  // 両側は曲線でつなぎ、端は直線で閉じる（端まで曲線でつなぐと、折り返しで外にはみ出す）
  return `${spline(left)} L${spline(right.reverse()).slice(1)} Z`;
}

/** 左右対称の形にするため、x = 120 を軸に反転する */
export const mirror = (points: Point[]): Point[] => points.map(([x, y]) => [240 - x, y]);

/** 小さな円をたくさん並べた 1 つの path（無精ひげやそばかすの点々） */
export function dots(points: Point[], r: number): string {
  return points.map(([x, y]) => `M${round(x - r)} ${round(y)} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`).join(" ");
}

/** 再現できる疑似乱数。同じ回答なら毎回同じ形になるようにする */
export function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 帽子の輪郭（左のつばから上を回って右のつばまで）の内側と、つばより下だけを残す切り抜きの path。
 * 帽子の後ろから髪がはみ出ないように、髪をこの形で切り抜く
 */
export function underHat(outline: Point[]): string {
  const points = sampleSpline(outline, 6);
  const [first, last] = [points[0], points[points.length - 1]];
  return `M-20 260 L-20 ${round(first[1])} ${points.map((p) => `L${fmt(p)}`).join(" ")} L260 ${round(last[1])} L260 260 Z`;
}
