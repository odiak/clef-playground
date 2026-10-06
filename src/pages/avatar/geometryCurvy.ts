import type { AvatarStageId, OptionId } from "../../../shared/avatar";
import { darken, lighten, mix } from "./color";
import { brush, dots, mirror, type Point, random, sampleSpline, spline } from "./curves";
import type { Layer, Part, Shape } from "./geometry";
import { BLUSH, CLOTHES, FRECKLE, GOLD, HAIR, INK, IRIS, LIP, MOUTH_INSIDE, SKIN, WHITE } from "./palette";
import type { AvatarParams } from "./params";

// 楕円や単純な曲線ではなく、点を滑らかにつなぐ曲線（スプライン）と、太さの変わる筆の線で形を作る

type Face = { top: number; cheekW: number; cheekY: number; jawW: number; jawY: number; chinW: number; chinY: number };

/** 輪郭を決める点。頬骨・エラ・あごの幅と高さで顔の形を作り分ける */
const FACE: Record<OptionId<"face_shape">, Face> = {
  round: { top: 52, cheekW: 55, cheekY: 112, jawW: 46, jawY: 148, chinW: 20, chinY: 170 },
  oval: { top: 52, cheekW: 51, cheekY: 110, jawW: 38, jawY: 150, chinW: 13, chinY: 173 },
  square: { top: 54, cheekW: 53, cheekY: 110, jawW: 49, jawY: 150, chinW: 24, chinY: 168 },
  long: { top: 48, cheekW: 47, cheekY: 112, jawW: 37, jawY: 156, chinW: 13, chinY: 178 },
};

const EYE: Record<OptionId<"eye_size">, { w: number; h: number }> = {
  small: { w: 9, h: 4.6 },
  medium: { w: 10.5, h: 5.6 },
  large: { w: 12, h: 6.8 },
};
const EYE_SLANT: Record<OptionId<"eye_slant">, number> = { droopy: 9, level: 0, upturned: -9 };
const BROW: Record<OptionId<"brow_thickness">, number> = { thin: 2.6, medium: 3.8, thick: 5.6 };
const NOSE: Record<OptionId<"nose_size">, number> = { small: 0.8, medium: 1, large: 1.25 };
const LIP_THICKNESS: Record<OptionId<"lip_thickness">, number> = { thin: -1.5, medium: 0, full: 2 };

const EYES = [
  [98, -1],
  [142, 1],
] as const;
const EYE_Y = 113;

/** 顔の輪郭の点。dy だけ下にずらせる（首に落ちるあごの影に使う） */
function facePoints(f: Face, dy = 0): Point[] {
  const right: Point[] = [
    [120 + f.cheekW * 0.7, f.top + 7],
    [120 + f.cheekW * 0.96, f.cheekY - 26],
    [120 + f.cheekW, f.cheekY],
    [120 + f.jawW, f.jawY],
    [120 + f.chinW, f.chinY - 5],
  ];
  const points: Point[] = [[120, f.top], ...right, [120, f.chinY], ...mirror(right).reverse()];
  return points.map(([x, y]) => [x, y + dy]);
}

/** 高さ y での顔の半分の幅（だいたい） */
function faceHalfWidth(f: Face, y: number): number {
  const stops: Point[] = [
    [f.cheekY, f.cheekW],
    [f.jawY, f.jawW],
    [f.chinY - 5, f.chinW],
    [f.chinY, 0],
  ];
  if (y <= stops[0][0]) return f.cheekW;
  for (let i = 1; i < stops.length; i++) {
    const [y0, w0] = stops[i - 1];
    const [y1, w1] = stops[i];
    if (y <= y1) return w0 + ((w1 - w0) * (y - y0)) / (y1 - y0);
  }
  return 0;
}

/** 髪質に合わせて、髪の輪郭の点を揺らす */
function texturize(points: Point[], texture: OptionId<"hair_texture">, outward: 1 | -1, from = 2): Point[] {
  if (texture === "straight") return points;
  if (texture === "wavy") return points.map(([x, y], i) => (i < from ? [x, y] : [x + Math.sin(y / 11) * 4.5 * outward, y]));
  return sampleSpline(points, 2).map(([x, y], i) => (i < from * 2 ? [x, y] : [x + (i % 2 ? 7 : -1) * outward, y]));
}

/** 中心から放射状に、点を外へ出したり内へ入れたりして、もこもこさせる */
function bumpy(points: Point[], center: Point, amount: number): Point[] {
  return sampleSpline(points, 2).map(([x, y], i) => {
    const dx = x - center[0];
    const dy = y - center[1];
    const length = Math.hypot(dx, dy) || 1;
    const offset = i % 2 ? amount : -amount * 0.2;
    return [x + (dx / length) * offset, y + (dy / length) * offset];
  });
}

/** 円に近い形を点で作る。radius(i) で点ごとに半径を変えられる */
function ring(center: Point, count: number, radius: (i: number) => number): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return [center[0] + Math.cos(a) * radius(i), center[1] + Math.sin(a) * radius(i)];
  });
}

function hashParams(p: AvatarParams): number {
  let hash = 2166136261;
  for (const c of JSON.stringify(p)) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return hash;
}

export function buildCurvyLayers(p: AvatarParams): Layer[] {
  const layers: Layer[] = [];
  const add = (stage: AvatarStageId, part: Part, shape: Shape, options: Partial<Layer> & { filled: boolean }) => {
    const layer: Layer = { stage, part, shape, strokeWidth: 3, ...options };
    layers.push(layer);
    return layer;
  };
  const fill = (stage: AvatarStageId, part: Part, d: string | Shape, color: string, options: Partial<Layer> = {}) =>
    add(stage, part, typeof d === "string" ? { type: "path", d } : d, { filled: true, color, ...options });
  const line = (stage: AvatarStageId, part: Part, d: string, strokeWidth: number, options: Partial<Layer> = {}) =>
    add(stage, part, { type: "path", d }, { filled: false, strokeWidth, ...options });
  const rand = random(hashParams(p));

  const f = FACE[p.faceShape];
  const skin = SKIN[p.skinTone];
  const skinShadow = darken(skin, 0.12);
  const skinLine = darken(skin, 0.42);
  const hair = HAIR[p.hairColor];
  const hairDark = darken(hair, 0.3);
  // 眉やひげの色。髪がない人や、髪を派手な色に染めている人はこげ茶にする
  const bodyHair = p.hairLength === "bald" || p.hairColor === "colorful" ? HAIR.dark_brown : hair;
  const clothes = CLOTHES[p.clothingColor];
  const clothesLine = darken(clothes, 0.28);
  const faceShape: Shape = { type: "path", d: spline(facePoints(f), true) };
  const hasLongHair = p.hairLength === "medium" || p.hairLength === "long";
  const bun = p.hairTied && hasLongHair && p.hat === "none";
  const hairBack = hasLongHair && !p.hairTied ? (p.hairLength as "medium" | "long") : null;
  const hasCap = p.hairLength !== "bald" && p.hairLength !== "buzz";

  // ── 後ろ髪 ──
  if (bun) {
    fill("hair", "hair", spline(ring([120, 26], 12, (i) => (i % 2 ? 15 : 17.5)), true), darken(hair, 0.08));
    line("hair", "hairLine", spline([[106, 36], [120, 40], [134, 36]]), 2, { color: hairDark, opacity: 0.7 });
  }
  if (hairBack) {
    const side: Point[] =
      hairBack === "long"
        ? [[146, 36], [172, 54], [184, 88], [184, 124], [182, 160], [178, 192], [172, 216]]
        : [[146, 36], [170, 52], [180, 82], [180, 112], [176, 140], [170, 162], [162, 178]];
    const bottom: Point[] = hairBack === "long" ? [[156, 222], [140, 214]] : [[150, 184], [138, 176]];
    const right = texturize(side, p.hairTexture, 1);
    fill("hair", "hair", spline([[120, 32], ...right, ...bottom, ...mirror(bottom).reverse(), ...mirror(right).reverse()], true), darken(hair, 0.12));
  }

  // ── 首と服 ──
  const neck: Shape = { type: "path", d: spline([[104, 144], [105.5, 164], [100, 190], [140, 190], [134.5, 164], [136, 144]], true) };
  fill("face", "skin", neck, skin);
  // あごの影。輪郭を少し下にずらした形を首の形で切り抜く
  fill("face", "shadow", spline(facePoints(f, 7), true), skinShadow, { strokeWidth: 0, clip: neck });
  fill("clothes", "clothes", spline([[22, 246], [28, 212], [50, 192], [90, 181], [150, 181], [190, 192], [212, 212], [218, 246]], true), clothes);
  fill("clothes", "skin", spline([[94, 181], [107, 193], [120, 197], [133, 193], [146, 181]], true), skin, { strokeWidth: 0 });
  fill("clothes", "shadow", spline([[100, 182], [120, 190], [140, 182], [134, 188], [120, 193], [106, 188]], true), skinShadow, { strokeWidth: 0 });
  line("clothes", "detail", spline([[93, 181.5], [107, 194], [120, 198.5], [133, 194], [147, 181.5]]), 3.5, { color: clothesLine });
  line("clothes", "detail", spline([[60, 212], [66, 226], [66, 244]]), 2.2, { color: clothesLine });
  line("clothes", "detail", spline(mirror([[60, 212], [66, 226], [66, 244]])), 2.2, { color: clothesLine });

  // ── 耳とピアス ──
  for (const s of [-1, 1] as const) {
    const ex = 120 + s * (f.cheekW - 4);
    fill("face", "skin", spline([[ex, 100], [ex + s * 9, 97], [ex + s * 14, 108], [ex + s * 11, 123], [ex + s * 3, 131], [ex - s * 5, 118]], true), skin);
    line("face", "detail", spline([[ex + s * 4, 105], [ex + s * 9, 108], [ex + s * 8.5, 118], [ex + s * 4, 124]]), 2, { color: skinLine, opacity: 0.6 });
    if (p.earrings) fill("extras", "earring", { type: "circle", cx: ex + s * 6, cy: 136, r: 3.8 }, GOLD, { strokeWidth: 2 });
  }

  // ── 顔の横に垂れる髪 ──
  if (hairBack) {
    const long = hairBack === "long";
    for (const s of [-1, 1] as const) {
      const outer: Point[] = long
        ? [[120 + s * 46, 92], [120 + s * 54, 130], [120 + s * 52, 170], [120 + s * 42, 206]]
        : [[120 + s * 46, 92], [120 + s * 52, 122], [120 + s * 50, 150], [120 + s * 42, 172]];
      const inner: Point[] = long
        ? [[120 + s * 38, 98], [120 + s * 44, 130], [120 + s * 40, 162]]
        : [[120 + s * 38, 98], [120 + s * 42, 124], [120 + s * 38, 148]];
      const wave = (points: Point[]) => texturize(points, p.hairTexture === "curly" ? "wavy" : p.hairTexture, s === 1 ? 1 : -1, 1);
      fill("hair", "hair", brush(wave(outer), (t) => 17 * (1 - t * 0.85)), hair);
      fill("hair", "hair", brush(wave(inner), (t) => 11 * (1 - t)), hair);
      line("hair", "hairLine", spline(wave(outer).slice(0, 3)), 1.6, { color: hairDark, opacity: 0.55 });
    }
  }

  // ── 顔 ──
  fill("face", "skin", faceShape, skin);

  // ── ほっぺ ──
  for (const s of [-1, 1] as const) {
    fill("cheeks", "blush", { type: "ellipse", cx: 120 + s * 34, cy: 130, rx: 11, ry: 6.5 }, BLUSH, { strokeWidth: 0, opacity: p.rosyCheeks ? 0.5 : 0.16 });
    if (p.freckles) {
      const points = Array.from({ length: 7 }, (): Point => [120 + s * 34 + (rand() - 0.5) * 18, 125 + (rand() - 0.5) * 10]);
      fill("cheeks", "freckle", dots(points, 1.4), FRECKLE, { strokeWidth: 0, opacity: 0.7 });
    }
  }

  // ── 前髪 ──
  if (p.hairLength === "bald") {
    fill("hair", "shine", brush([[94, 66], [106, 58], [122, 57]], (t) => 5.5 * Math.sin(Math.PI * t) + 0.3), WHITE, { strokeWidth: 0, opacity: 0.6 });
  } else if (p.hairLength === "buzz") {
    const buzz: Point[] = [[120, 40], [150, 44], [170, 62], [174, 92], [172, 110], [166, 96], [156, 74], [138, 64], [120, 62], [102, 64], [84, 74], [74, 96], [68, 110], [66, 92], [70, 62], [90, 44]];
    fill("hair", "hair", spline(buzz, true), hair, { fillOpacity: 0.88 });
    const stipple = Array.from({ length: 40 }, (): Point => [78 + rand() * 84, 46 + rand() * 24]);
    fill("hair", "hairLine", dots(stipple, 0.9), hairDark, { strokeWidth: 0, opacity: 0.45 });
  }

  // 毛束（中心線と太さ）を前髪の種類ごとに作る
  const strands: { center: Point[]; width: (t: number) => number }[] = [];
  if (hasCap) {
    if (p.bangs === "full") {
      const tips: Point[] = [[80, 104], [93, 97], [106, 101], [120, 95], [134, 101], [147, 97], [160, 104]];
      for (const i of [0, 6, 1, 5, 2, 4, 3]) {
        const [tx, ty] = tips[i];
        strands.push({
          center: [[120 + (tx - 120) * 0.3, 48], [120 + (tx - 120) * 0.85, 68 + Math.abs(tx - 120) * 0.12], [tx, ty]],
          width: (t) => 24 * (1 - t) ** 1.1 + 0.8,
        });
      }
    } else if (p.bangs === "side") {
      const tips: Point[] = [[78, 100], [166, 104], [150, 96], [134, 99], [116, 94]];
      tips.forEach(([tx, ty], i) => {
        const root: Point = [100 + i * 3, 48];
        strands.push({ center: [root, [(root[0] + tx) / 2 - 6, 66], [tx, ty]], width: (t) => 26 * (1 - t) ** 1.1 + 0.8 });
      });
    } else {
      for (const s of [-1, 1]) {
        strands.push({ center: [[120 - s * 2, 46], [120 + s * 22, 52], [120 + s * 42, 74], [120 + s * 50, 104]], width: (t) => 22 * (1 - t) + 2 });
      }
    }
  }

  if (hasCap) {
    // 前髪の影。毛束を少し下にずらした形を顔の形で切り抜く
    for (const { center, width } of strands) {
      fill("hair", "shadow", brush(center.map(([x, y]) => [x, y + 5]), width), skinShadow, { strokeWidth: 0, clip: faceShape });
    }
    const outer: Point[] = [[146, 34], [168, 46], [180, 72], [182, 100], [178, 122]];
    const hairline: Point[] = [[168, 106], [164, 82], [146, 66], [120, 62], [94, 66], [76, 82], [72, 106]];
    const capPoints: Point[] = [[120, 30], ...outer, ...hairline, ...mirror(outer).reverse()];
    const cap = p.hairTexture === "curly" ? bumpy(capPoints, [120, 100], 6) : capPoints;
    fill("hair", "hair", spline(cap, true), hair);
    for (const { center, width } of strands) fill("hair", "hair", brush(center, width), hair, { strokeWidth: 2.2 });
    // 髪の流れの線とハイライト
    for (const { center } of strands.slice(-3)) {
      line("hair", "hairLine", spline(sampleSpline(center, 4).slice(2, 7)), 1.5, { color: hairDark, opacity: 0.6 });
    }
    const highlight = p.hairColor === "blonde" || p.hairColor === "gray" ? WHITE : lighten(hair, 0.45);
    fill("hair", "hairHighlight", brush([[86, 58], [100, 46], [118, 41], [130, 42]], (t) => 6 * Math.sin(Math.PI * t) + 0.3), highlight, {
      strokeWidth: 0,
      opacity: 0.55,
    });
  }

  // ── 眉 ──
  for (const s of [-1, 1] as const) {
    const arched = p.browShape === "arched";
    const center: Point[] = [[120 + s * 10, 96], [120 + s * 21, arched ? 88.5 : 92], [120 + s * 33, arched ? 92.5 : 93.5]];
    const base = BROW[p.browThickness];
    fill("brows", "brow", brush(center, (t) => base * (1 - 0.55 * t) + 0.4), darken(bodyHair, 0.1), { strokeWidth: 0 });
  }

  // ── 目 ──
  for (const [cx, s] of EYES) {
    const { w, h: baseH } = EYE[p.eyeSize];
    const h = p.monolid ? baseH * 0.78 : baseH;
    const cy = EYE_Y;
    const inner: Point = [cx - s * w, cy];
    const outer: Point = [cx + s * w, cy - h * 0.15];
    const almond: Shape = {
      type: "path",
      d: `M${inner[0]} ${inner[1]} C${cx - s * w * 0.45} ${cy - h * 1.35} ${cx + s * w * 0.5} ${cy - h * 1.3} ${outer[0]} ${outer[1]} C${cx + s * w * 0.55} ${cy + h * 0.85} ${cx - s * w * 0.4} ${cy + h * 0.95} ${inner[0]} ${inner[1]} Z`,
    };
    const transform = `rotate(${EYE_SLANT[p.eyeSlant] * s} ${cx} ${cy})`;
    const irisX = cx + s * w * 0.05;
    const irisY = cy - h * 0.05;
    fill("eyes", "sclera", almond, WHITE, { strokeWidth: 1.8, transform });
    fill("eyes", "iris", { type: "circle", cx: irisX, cy: irisY, r: h * 1.05 }, IRIS[p.eyeColor], { strokeWidth: 0, clip: almond, transform });
    fill("eyes", "pupil", { type: "circle", cx: irisX, cy: irisY, r: h * 0.5 }, INK, { strokeWidth: 0, clip: almond, transform });
    // まぶたの影
    fill("eyes", "shadow", { type: "ellipse", cx, cy: cy - h * 1.05, rx: w * 1.1, ry: h * 0.6 }, "#000000", { strokeWidth: 0, opacity: 0.12, clip: almond, transform });
    fill("eyes", "highlight", { type: "circle", cx: irisX + h * 0.35, cy: irisY - h * 0.45, r: h * 0.28 }, WHITE, { strokeWidth: 0, clip: almond, transform });
    // 上まぶたの線。目尻に向かって太くする
    const lid: Point[] = [inner, [cx - s * w * 0.4, cy - h * 1.05], [cx + s * w * 0.45, cy - h * 1.0], [outer[0] + s * 2, outer[1] - 1]];
    fill("eyes", "lash", brush(lid, (t) => (p.monolid ? 2.2 : 1.4) + 2.4 * t), INK, { strokeWidth: 0, transform });
    if (p.longLashes) {
      fill("eyes", "lash", brush([[outer[0] + s * 1, outer[1] - 1], [outer[0] + s * 5, outer[1] - 4], [outer[0] + s * 8, outer[1] - 8]], (t) => 3 * (1 - t) + 0.3), INK, {
        strokeWidth: 0,
        transform,
      });
      fill("eyes", "lash", brush([[cx + s * w * 0.4, cy - h * 1.05], [cx + s * w * 0.55, cy - h * 1.5], [cx + s * w * 0.75, cy - h * 1.8]], (t) => 2.2 * (1 - t) + 0.3), INK, {
        strokeWidth: 0,
        transform,
      });
    }
    if (!p.monolid) {
      line("eyes", "detail", spline([[cx - s * w * 0.75, cy - h * 1.25], [cx + s * w * 0.1, cy - h * 1.75], [cx + s * w * 0.85, cy - h * 1.3]]), 1.5, { color: skinLine, transform });
    }
    line("eyes", "detail", spline([[cx - s * w * 0.7, cy + h * 0.55], [cx, cy + h * 0.85], [cx + s * w * 0.75, cy + h * 0.45]]), 1.2, { color: skinLine, opacity: 0.6, transform });
  }

  // ── 鼻 ──
  const k = NOSE[p.noseSize];
  const nostrils: Point[] = [[-7, -1], [-4, 3], [0, 2], [4, 3], [7, -1]].map(([x, y]) => [120 + x * k, 128 + y * k]);
  line("mouth", "detail", spline([[123, 104], [125, 116], [124, 123]]), 1.8, { color: skinLine, opacity: 0.35 });
  line("mouth", "nose", spline(nostrils), 2.2, { color: skinLine });

  // ── ひげ ──
  if (p.facialHair === "stubble") {
    const points: Point[] = [];
    for (let i = 0; i < 160 && points.length < 70; i++) {
      const x = 120 + (rand() - 0.5) * 2 * f.cheekW;
      const y = 132 + rand() * (f.chinY - 132);
      const insideFace = Math.abs(x - 120) < faceHalfWidth(f, y) - 3;
      const onMouth = ((x - 120) / 17) ** 2 + ((y - 147) / 7) ** 2 < 1;
      if (insideFace && !onMouth) points.push([x, y]);
    }
    fill("extras", "stubble", dots(points, 0.9), bodyHair, { strokeWidth: 0, opacity: 0.55, clip: faceShape });
  }
  if (p.facialHair === "beard") {
    const rightOuter: Point[] = [[120 + f.cheekW - 2, 116], [120 + f.cheekW + 0.5, 132], [120 + f.jawW + 3, f.jawY + 3], [120 + f.chinW + 8, f.chinY + 3]];
    const leftInner: Point[] = [[120 - f.cheekW + 9, 122], [104, 138], [103, 151]];
    const underMouth: Point[] = [[112, 156], [120, 157.5], [128, 156]];
    const points = [...rightOuter, [120, f.chinY + 10] as Point, ...mirror(rightOuter).reverse(), ...leftInner, ...underMouth, ...mirror(leftInner).reverse()];
    fill("extras", "facialHair", spline(points, true), bodyHair, { strokeWidth: 2.5 });
  }
  if (p.facialHair === "mustache" || p.facialHair === "beard") {
    const half: Point[] = [[126, 133.5], [133, 134.5], [137, 139.5], [131, 139], [125, 140]];
    const mustache: Point[] = [[120, 136.5], ...half, [120, 139.5], ...mirror(half).reverse()];
    fill("extras", "facialHair", spline(mustache, true), bodyHair, { strokeWidth: 2 });
  }

  // ── 口 ──
  const lipColor = mix(skin, LIP, 0.6);
  if (p.mouthOpen) {
    const mouth: Shape = {
      type: "path",
      d: p.smiling
        ? spline([[106, 143], [113, 141.5], [120, 143], [127, 141.5], [134, 143], [128, 155], [120, 158], [112, 155]], true)
        : spline([[120, 139.5], [126.5, 143], [127.5, 150], [120, 155.5], [112.5, 150], [113.5, 143]], true),
    };
    fill("mouth", "mouthInside", mouth, MOUTH_INSIDE, { strokeWidth: 2.5 });
    if (p.smiling) fill("mouth", "teeth", spline([[104, 141], [136, 141], [133, 148], [120, 149.5], [107, 148]], true), WHITE, { strokeWidth: 0, clip: mouth });
    fill("mouth", "lip", { type: "ellipse", cx: 120, cy: p.smiling ? 157 : 155, rx: 8, ry: 4.5 }, "#e3707c", { strokeWidth: 0, clip: mouth });
  } else {
    const lt = LIP_THICKNESS[p.lipThickness];
    const [left, right, mid]: [Point, Point, number] = p.smiling ? [[106, 143.5], [134, 143.5], 148.5] : [[109, 146.5], [131, 146.5], 147.3];
    const upper: Point[] = [left, [113, 142.5], [118, 141.5], [120, 142.8], [122, 141.5], [127, 142.5], right];
    const lower: Point[] = [[127, 151.5 + lt], [120, 153 + lt], [113, 151.5 + lt]];
    fill("mouth", "lip", spline([...upper, ...lower], true), lipColor, { strokeWidth: 0, opacity: 0.9 });
    fill("mouth", "highlight", { type: "ellipse", cx: 121, cy: 150 + lt * 0.6, rx: 3.5, ry: 1.3 }, WHITE, { strokeWidth: 0, opacity: 0.35 });
    line("mouth", "mouth", spline([left, [114, mid - 0.8], [120, mid], [126, mid - 0.8], right]), 2.4);
    if (p.smiling) {
      for (const side of [-1, 1]) {
        const dimple: Point[] = [[104.5, 141], [104, 144.5], [105.5, 147]];
        line("mouth", "detail", spline(side === 1 ? mirror(dimple) : dimple), 1.4, { color: skinLine, opacity: 0.6 });
      }
    }
  }

  // ── メガネ ──
  if (p.glasses !== "none") {
    const sunglasses = p.glasses === "sunglasses";
    // 右のレンズを作って、左は反転する
    const cx = 142;
    const lens: Point[] =
      p.glasses === "round"
        ? ring([cx, 112], 10, () => 15)
        : sunglasses
          ? [[cx - 16, 103], [cx + 16, 103], [cx + 15, 112], [cx + 6, 122], [cx - 8, 121], [cx - 15, 113]]
          : [[cx - 16, 102], [cx, 100.5], [cx + 16, 102], [cx + 16.5, 113], [cx + 14, 123], [cx, 124], [cx - 14, 123], [cx - 16.5, 113]];
    for (const points of [mirror(lens), lens]) {
      fill("extras", "lens", spline(points, true), sunglasses ? INK : WHITE, { strokeWidth: 3, fillOpacity: sunglasses ? 0.9 : 0.18 });
    }
    line("extras", "frame", spline([[113, 109], [120, 105], [127, 109]]), 3);
    line("extras", "frame", spline([[82, 108], [120 - f.cheekW + 1, 105]]), 3);
    line("extras", "frame", spline([[158, 108], [120 + f.cheekW - 1, 105]]), 3);
    if (sunglasses) {
      for (const cx of [98, 142]) line("extras", "shine", spline([[cx - 9, 108], [cx - 4, 105], [cx + 1, 104]]), 2, { color: WHITE, opacity: 0.6 });
    }
  }

  // ── 帽子 ──
  if (p.hat === "cap") {
    const color = "#f38020";
    fill("extras", "hat", spline([[60, 98], [62, 64], [84, 38], [120, 30], [156, 38], [178, 64], [180, 98], [120, 92]], true), color);
    line("extras", "detail", spline([[120, 31], [118, 60], [120, 92]]), 2, { color: darken(color, 0.25) });
    line("extras", "detail", spline([[96, 37], [88, 62], [86, 94]]), 2, { color: darken(color, 0.25) });
    line("extras", "detail", spline(mirror([[96, 37], [88, 62], [86, 94]])), 2, { color: darken(color, 0.25) });
    fill("extras", "hatShade", spline([[58, 98], [120, 90], [182, 98], [186, 106], [120, 104], [54, 106]], true), darken(color, 0.2));
    fill("extras", "hatShade", { type: "circle", cx: 120, cy: 31, r: 4 }, darken(color, 0.2), { strokeWidth: 2 });
  } else if (p.hat === "beanie") {
    const color = "#faae40";
    fill("extras", "hat", spline(ring([120, 22], 14, (i) => (i % 2 ? 9 : 12)), true), color);
    fill("extras", "hat", spline([[60, 102], [62, 62], [86, 36], [120, 30], [154, 36], [178, 62], [180, 102], [120, 98]], true), color);
    fill("extras", "hatShade", { type: "rect", x: 56, y: 90, width: 128, height: 18, rx: 9 }, "#f38020");
    const ribs = Array.from({ length: 15 }, (_, i) => `M${64 + i * 8} 93 L${64 + i * 8} 105`).join(" ");
    line("extras", "detail", ribs, 1.6, { color: darken("#f38020", 0.2) });
  }

  return layers;
}
