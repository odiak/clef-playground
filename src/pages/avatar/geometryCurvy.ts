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

export type CurvyMode = "curvy" | "anime" | "comic";

/** 形の作り分け。アニメ風はあごを細く、アメコミ風はあごをがっしりさせる */
function faceForMode(f: Face, mode: CurvyMode): Face {
  if (mode === "anime") return { ...f, cheekY: f.cheekY - 2, jawW: f.jawW * 0.8, chinW: Math.max(4, f.chinW * 0.35), chinY: f.chinY + 2 };
  if (mode === "comic") return { ...f, jawW: f.jawW + 4, jawY: f.jawY + 2, chinW: f.chinW + 7 };
  return f;
}

const VOLUME: Record<OptionId<"hair_volume">, number> = { flat: 0.95, normal: 1, full: 1.08 };
const DARK_LINE = "#2a1a1a";

export function buildCurvyLayers(p: AvatarParams, mode: CurvyMode = "curvy"): Layer[] {
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
  const anime = mode === "anime";
  const comic = mode === "comic";

  const f = faceForMode(FACE[p.faceShape], mode);
  const skin = SKIN[p.skinTone];
  const skinShadow = darken(skin, comic ? 0.2 : 0.12);
  const skinLine = comic ? INK : darken(skin, 0.42);
  const hair = HAIR[p.hairColor];
  const hairDark = comic ? INK : darken(hair, 0.3);
  // 眉やひげの色。髪がない人や、髪を派手な色に染めている人はこげ茶にする
  const bodyHair = p.hairLength === "bald" || p.hairColor === "colorful" ? HAIR.dark_brown : hair;
  const clothes = CLOTHES[p.clothingColor];
  const clothesLine = darken(clothes, 0.28);
  const faceShape: Shape = { type: "path", d: spline(facePoints(f), true) };
  const hasLongHair = p.hairLength === "medium" || p.hairLength === "long";
  const updo = hasLongHair ? p.hairUpdo : "none";
  const spiky = p.hairStyledUp && (p.hairLength === "short" || p.hairLength === "medium") && updo === "none";
  const hairBack = hasLongHair && updo === "none" && !spiky ? (p.hairLength as "medium" | "long") : null;
  const hasCap = p.hairLength !== "bald" && p.hairLength !== "buzz";
  // 髪のボリュームに合わせて、髪の輪郭を横と上に広げる
  const k = VOLUME[p.hairVolume];
  const vol = (points: Point[]): Point[] => points.map(([x, y]) => [120 + (x - 120) * k, 100 + (y - 100) * (1 + (k - 1) * 0.7)]);

  // ── まとめ髪と後ろ髪 ──
  if (updo === "bun" && p.hat === "none") {
    fill("hairstyle", "hair", spline(ring([120, 26], 12, (i) => (i % 2 ? 15 : 17.5)), true), darken(hair, 0.08));
    line("hairstyle", "hairLine", spline([[106, 36], [120, 40], [134, 36]]), 2, { color: hairDark, opacity: 0.7 });
  }
  if (updo === "ponytail") {
    fill("hairstyle", "hair", brush([[152, 52], [182, 70], [194, 112], [186, 156]], (t) => 26 * (1 - t * 0.8)), darken(hair, 0.08));
  }
  if (updo === "twintails") {
    for (const s of [-1, 1]) {
      const tail: Point[] = [[120 + s * 34, 58], [120 + s * 66, 82], [120 + s * 76, 132], [120 + s * 68, 182]];
      fill("hairstyle", "hair", brush(texturize(tail, p.hairTexture === "curly" ? "wavy" : p.hairTexture, s === 1 ? 1 : -1, 1), (t) => 28 * (1 - t * 0.75)), hair);
      fill("hairstyle", "hat", { type: "circle", cx: 120 + s * 36, cy: 60, r: 5 }, "#f38020", { strokeWidth: 2 });
    }
  }
  if (hairBack) {
    const side: Point[] =
      hairBack === "long"
        ? [[146, 36], [172, 54], [184, 88], [184, 124], [182, 160], [178, 192], [172, 216]]
        : [[146, 36], [170, 52], [180, 82], [180, 112], [176, 140], [170, 162], [162, 178]];
    const bottom: Point[] = hairBack === "long" ? [[156, 222], [140, 214]] : [[150, 184], [138, 176]];
    const right = texturize(vol(side), p.hairTexture, 1);
    fill("hair", "hair", spline([[120, 32], ...right, ...bottom, ...mirror(bottom).reverse(), ...mirror(right).reverse()], true), darken(hair, 0.12));
  }

  // ── 首と服 ──
  const neckW = anime ? 13 : comic ? 18 : 16;
  const neck: Shape = { type: "path", d: spline([[120 - neckW, 144], [120 - neckW + 1.5, 164], [120 - neckW - 4, 190], [120 + neckW + 4, 190], [120 + neckW - 1.5, 164], [120 + neckW, 144]], true) };
  fill("face", "skin", neck, skin);
  // あごの影。輪郭を少し下にずらした形を首の形で切り抜く
  fill("face", "shadow", spline(facePoints(f, comic ? 9 : 7), true), skinShadow, { strokeWidth: 0, clip: neck });
  fill("clothes", "clothes", spline([[22, 246], [28, 212], [50, 192], [90, 181], [150, 181], [190, 192], [212, 212], [218, 246]], true), clothes);
  fill("clothes", "skin", spline([[94, 181], [107, 193], [120, 197], [133, 193], [146, 181]], true), skin, { strokeWidth: 0 });
  fill("clothes", "shadow", spline([[100, 182], [120, 190], [140, 182], [134, 188], [120, 193], [106, 188]], true), skinShadow, { strokeWidth: 0 });
  line("clothes", "detail", spline([[93, 181.5], [107, 194], [120, 198.5], [133, 194], [147, 181.5]]), 3.5, { color: clothesLine });
  line("clothes", "detail", spline([[60, 212], [66, 226], [66, 244]]), 2.2, { color: clothesLine });
  line("clothes", "detail", spline(mirror([[60, 212], [66, 226], [66, 244]])), 2.2, { color: clothesLine });
  if (comic) {
    // 服の右側の影
    fill("clothes", "shadow", spline([[150, 182], [190, 194], [212, 214], [218, 246], [160, 246], [156, 214]], true), darken(clothes, 0.25), { strokeWidth: 0 });
  }

  // ── 耳とピアス ──
  for (const s of [-1, 1] as const) {
    const ex = 120 + s * (f.cheekW - 4);
    fill("face", "skin", spline([[ex, 100], [ex + s * 9, 97], [ex + s * 14, 108], [ex + s * 11, 123], [ex + s * 3, 131], [ex - s * 5, 118]], true), skin);
    line("face", "detail", spline([[ex + s * 4, 105], [ex + s * 9, 108], [ex + s * 8.5, 118], [ex + s * 4, 124]]), 2, { color: skinLine, opacity: 0.6 });
    if (p.earrings) fill("extras", "earring", { type: "circle", cx: ex + s * 6, cy: 136, r: 3.8 }, GOLD, { strokeWidth: 2 });
  }

  // ── 耳にかかる横髪 ──
  const wave = (points: Point[], s: number) => texturize(points, p.hairTexture === "curly" ? "wavy" : p.hairTexture, s === 1 ? 1 : -1, 1);
  if (p.earsCovered && !spiky && hasCap) {
    for (const s of [-1, 1] as const) {
      if (hairBack) {
        const long = hairBack === "long";
        const outer: Point[] = long
          ? [[120 + s * 46, 92], [120 + s * 54, 130], [120 + s * 52, 170], [120 + s * 42, 206]]
          : [[120 + s * 46, 92], [120 + s * 52, 122], [120 + s * 50, 150], [120 + s * 42, 172]];
        const inner: Point[] = long
          ? [[120 + s * 38, 98], [120 + s * 44, 130], [120 + s * 40, 162]]
          : [[120 + s * 38, 98], [120 + s * 42, 124], [120 + s * 38, 148]];
        fill("hairstyle", "hair", brush(wave(outer, s), (t) => 17 * (1 - t * 0.85)), hair);
        fill("hairstyle", "hair", brush(wave(inner, s), (t) => 11 * (1 - t)), hair);
        line("hairstyle", "hairLine", spline(wave(outer, s).slice(0, 3)), 1.6, { color: hairDark, opacity: 0.55 });
      } else {
        fill("hairstyle", "hair", brush(wave([[120 + s * 46, 92], [120 + s * 53, 112], [120 + s * 51, 134]], s), (t) => 15 * (1 - t * 0.8)), hair);
      }
    }
  }

  // ── もみあげ ──
  if (p.sideburns && p.hairLength !== "bald") {
    for (const s of [-1, 1]) {
      const center: Point[] = [[120 + s * (f.cheekW - 3), 96], [120 + s * (f.cheekW - 1.5), 112], [120 + s * (f.cheekW - 4), 128]];
      fill("beard", "facialHair", brush(center, (t) => 9 - t * 4), bodyHair, { strokeWidth: 2 });
    }
  }

  // ── 顔 ──
  fill("face", "skin", faceShape, skin);
  if (comic) {
    // 左から光が当たっているように、顔の右側に影を入れる
    fill("face", "shadow", spline([[146, 40], [134, 76], [140, 106], [134, 140], [124, 170], [122, 200], [210, 200], [210, 40]], true), skinShadow, {
      strokeWidth: 0,
      clip: faceShape,
    });
  }

  // ── ほっぺ ──
  for (const s of [-1, 1] as const) {
    if (!comic) {
      fill("cheeks", "blush", { type: "ellipse", cx: 120 + s * 34, cy: 130, rx: 11, ry: 6.5 }, BLUSH, { strokeWidth: 0, opacity: p.rosyCheeks ? 0.5 : anime ? 0.3 : 0.16 });
    }
    if (anime) {
      // アニメの照れ線
      for (const dx of [-5, 0, 5]) {
        line("cheeks", "detail", `M${120 + s * 34 + dx + 2} 126 l-4 7`, 1.4, { color: darken(BLUSH, 0.3), opacity: p.rosyCheeks ? 0.8 : 0.45 });
      }
    }
    if (comic) {
      // 頬骨の短い線
      line("cheeks", "detail", spline([[120 + s * 41, 118], [120 + s * 38, 126], [120 + s * 34, 131]]), 1.5, { color: INK, opacity: 0.55 });
    }
    if (p.freckles) {
      const points = Array.from({ length: 7 }, (): Point => [120 + s * 34 + (rand() - 0.5) * 18, 125 + (rand() - 0.5) * 10]);
      fill("cheeks", "freckle", dots(points, 1.4), FRECKLE, { strokeWidth: 0, opacity: 0.7 });
    }
  }
  if (comic) line("face", "detail", spline([[115, f.chinY - 6], [120, f.chinY - 4], [125, f.chinY - 6]]), 1.5, { color: INK, opacity: 0.7 });

  // ── 頭の髪 ──
  if (p.hairLength === "bald") {
    fill("hair", "shine", brush([[94, 66], [106, 58], [122, 57]], (t) => 5.5 * Math.sin(Math.PI * t) + 0.3), WHITE, { strokeWidth: 0, opacity: 0.6 });
  } else if (p.hairLength === "buzz") {
    const buzz: Point[] = [[120, 40], [150, 44], [170, 62], [174, 92], [172, 110], [166, 96], [156, 74], [138, 64], [120, 62], [102, 64], [84, 74], [74, 96], [68, 110], [66, 92], [70, 62], [90, 44]];
    fill("hair", "hair", spline(buzz, true), hair, { fillOpacity: 0.88 });
    const stipple = Array.from({ length: 40 }, (): Point => [78 + rand() * 84, 46 + rand() * 24]);
    fill("hair", "hairLine", dots(stipple, 0.9), hairDark, { strokeWidth: 0, opacity: 0.45 });
  }

  // 毛束（中心線と太さ）を、前髪の種類・分け目・髪を立てているかで作り分ける
  type Strand = { center: Point[]; width: (t: number) => number };
  const strands: Strand[] = [];
  const sharp = anime ? 1.5 : 1.1;
  const flip = (points: Point[]) => (p.hairParting === "right" ? mirror(points) : points);
  if (hasCap) {
    if (spiky) {
      for (const i of [-3, 3, -2, 2, -1, 1, 0]) {
        const bx = 120 + i * 14;
        const lift = (3 - Math.abs(i)) * 4;
        strands.push({ center: [[bx, 68], [bx + i * 5, 46 - lift], [bx + i * 10, 24 - lift]], width: (t) => 22 * (1 - t) ** sharp + 0.5 });
      }
    } else if (p.bangs === "full") {
      const tips: Point[] = anime
        ? [[78, 106], [88, 96], [98, 104], [109, 94], [120, 102], [131, 94], [142, 104], [152, 96], [162, 106]]
        : [[80, 104], [93, 97], [106, 101], [120, 95], [134, 101], [147, 97], [160, 104]];
      const order = [...tips.keys()].sort((a, b) => Math.abs(b - (tips.length - 1) / 2) - Math.abs(a - (tips.length - 1) / 2));
      for (const i of order) {
        const [tx, ty] = tips[i];
        strands.push({
          center: [[120 + (tx - 120) * 0.3, 48], [120 + (tx - 120) * 0.85, 68 + Math.abs(tx - 120) * 0.12], [tx, ty]],
          width: (t) => (anime ? 20 : 24) * (1 - t) ** sharp + 0.8,
        });
      }
    } else if (p.bangs === "side") {
      const tips: Point[] = [[78, 100], [166, 104], [150, 96], [134, 99], [116, 94]];
      tips.forEach(([tx, ty], i) => {
        const root: Point = [100 + i * 3, 48];
        strands.push({ center: flip([root, [(root[0] + tx) / 2 - 6, 66], [tx, ty]]), width: (t) => 26 * (1 - t) ** sharp + 0.8 });
      });
    } else if (p.hairParting === "left" || p.hairParting === "right") {
      // 分け目から、狭いほうと広いほうに流す
      strands.push({ center: flip([[100, 46], [88, 58], [76, 80], [70, 104]]), width: (t) => 18 * (1 - t) + 2 });
      strands.push({ center: flip([[102, 44], [130, 50], [156, 70], [168, 102]]), width: (t) => 28 * (1 - t) + 2 });
    } else {
      for (const s of [-1, 1]) {
        strands.push({ center: [[120 - s * 2, 46], [120 + s * 22, 52], [120 + s * 42, 74], [120 + s * 50, 104]], width: (t) => 22 * (1 - t) + 2 });
      }
    }
  }

  if (hasCap) {
    // 前髪の影。毛束を少し下にずらした形を顔の形で切り抜く
    for (const { center, width } of strands) {
      if (spiky) break;
      fill("hairstyle", "shadow", brush(center.map(([x, y]) => [x, y + 5]), width), skinShadow, { strokeWidth: 0, clip: faceShape });
    }
    const outer: Point[] = [[146, 34], [168, 46], [180, 72], [182, 100], [178, 122]];
    const hairline: Point[] = [[168, 106], [164, 82], [146, 66], [120, 62], [94, 66], [76, 82], [72, 106]];
    const capPoints = vol([[120, 30], ...outer, ...hairline, ...mirror(outer).reverse()]);
    const cap = p.hairTexture === "curly" ? bumpy(capPoints, [120, 100], 6) : capPoints;
    const capShape: Shape = { type: "path", d: spline(cap, true) };
    fill("hair", "hair", capShape, hair);
    if (comic) {
      // 髪の右側の影
      fill("hair", "shadow", spline([[150, 20], [146, 60], [160, 90], [172, 130], [200, 130], [200, 20]], true), darken(hair, 0.35), { strokeWidth: 0, clip: capShape });
    }
    for (const { center, width } of strands) fill("hairstyle", "hair", brush(center, width), hair, { strokeWidth: 2.2 });
    // 髪の流れの線
    for (const { center } of strands.slice(comic ? 0 : -3)) {
      line("hairstyle", "hairLine", spline(sampleSpline(center, 4).slice(2, 7)), comic ? 1.3 : 1.5, { color: hairDark, opacity: comic ? 0.8 : 0.6 });
    }
    // ハイライト。アニメ風はギザギザの天使の輪にする
    const highlight = p.hairColor === "blonde" || p.hairColor === "gray" ? WHITE : lighten(hair, 0.45);
    if (anime && !spiky) {
      const ringPoints: Point[] = [[84, 60], [100, 47], [120, 43], [140, 47], [156, 60], [150, 63], [144, 56], [138, 63], [130, 55], [120, 62], [110, 55], [102, 63], [96, 56], [90, 63]];
      fill("hair", "hairHighlight", spline(ringPoints, true), WHITE, { strokeWidth: 0, opacity: 0.55 });
    } else if (!comic) {
      fill("hair", "hairHighlight", brush([[86, 58], [100, 46], [118, 41], [130, 42]], (t) => 6 * Math.sin(Math.PI * t) + 0.3), highlight, { strokeWidth: 0, opacity: 0.55 });
    }
    // アニメのアホ毛
    if (anime && p.hat === "none" && updo !== "bun") {
      fill("hairstyle", "hair", brush([[118, 36], [122, 20], [132, 14], [138, 20]], (t) => 6 * (1 - t) + 0.4), hair, { strokeWidth: 2 });
    }
  }

  // ── 眉 ──
  for (const s of [-1, 1] as const) {
    const arched = p.browShape === "arched";
    const base = BROW[p.browThickness];
    if (comic) {
      // 眉間に寄せた太い眉
      const center: Point[] = [[120 + s * 9, 99], [120 + s * 21, arched ? 91 : 93.5], [120 + s * 34, arched ? 94 : 95]];
      fill("brows", "brow", brush(center, (t) => base * 1.35 * (1 - 0.4 * t) + 0.6), darken(bodyHair, 0.25), { strokeWidth: 0 });
    } else {
      const dy = anime ? -4 : 0;
      const center: Point[] = [[120 + s * 10, 96 + dy], [120 + s * 21, (arched ? 88.5 : 92) + dy], [120 + s * 33, (arched ? 92.5 : 93.5) + dy]];
      fill("brows", "brow", brush(center, (t) => base * (anime ? 0.6 : 1) * (1 - 0.55 * t) + 0.4), darken(bodyHair, 0.1), { strokeWidth: 0 });
    }
  }

  // ── 目 ──
  for (const [cx, s] of EYES) {
    const transform = `rotate(${EYE_SLANT[p.eyeSlant] * s} ${cx} ${EYE_Y})`;
    if (anime) {
      // 縦長の大きな目と、太いまつげ
      const w = { small: 11, medium: 12.5, large: 14 }[p.eyeSize];
      const h = w * (p.monolid ? 0.95 : 1.15);
      const cy = EYE_Y + 1;
      const iris = IRIS[p.eyeColor];
      const sclera: Shape = { type: "ellipse", cx, cy, rx: w, ry: h };
      fill("eyes", "sclera", sclera, WHITE, { strokeWidth: 0, transform });
      fill("eyes", "iris", { type: "ellipse", cx: cx + s, cy: cy + h * 0.1, rx: w * 0.72, ry: h * 0.92 }, iris, { strokeWidth: 1.2, clip: sclera, transform });
      fill("eyes", "shadow", { type: "ellipse", cx, cy: cy - h * 0.55, rx: w * 0.95, ry: h * 0.6 }, darken(iris, 0.45), { strokeWidth: 0, opacity: 0.7, clip: sclera, transform });
      fill("eyes", "pupil", { type: "ellipse", cx: cx + s, cy: cy + h * 0.15, rx: w * 0.3, ry: h * 0.42 }, darken(iris, 0.7), { strokeWidth: 0, clip: sclera, transform });
      fill("eyes", "highlight", { type: "circle", cx: cx - s * w * 0.25, cy: cy - h * 0.3, r: w * 0.28 }, WHITE, { strokeWidth: 0, transform });
      fill("eyes", "highlight", { type: "circle", cx: cx + s * w * 0.3, cy: cy + h * 0.45, r: w * 0.12 }, WHITE, { strokeWidth: 0, transform });
      const lid: Point[] = [[cx - s * w * 1.05, cy - h * 0.15], [cx - s * w * 0.4, cy - h * 1.02], [cx + s * w * 0.5, cy - h * 0.98], [cx + s * w * 1.15, cy - h * 0.35], [cx + s * w * 1.35, cy - h * 0.05]];
      fill("eyes", "lash", brush(lid, (t) => 1.5 + (p.monolid ? 5 : 4) * Math.sin(Math.PI * Math.min(1, t * 1.15))), DARK_LINE, { strokeWidth: 0, transform });
      const lashes = p.longLashes ? 3 : 1;
      for (let i = 0; i < lashes; i++) {
        const [lx, ly] = [cx + s * w * (1.1 - i * 0.25), cy - h * (0.4 + i * 0.3)];
        fill("eyes", "lash", brush([[lx, ly], [lx + s * 5, ly - 3], [lx + s * 8, ly - 2]], (t) => 2.6 * (1 - t) + 0.3), DARK_LINE, { strokeWidth: 0, transform });
      }
      line("eyes", "detail", spline([[cx + s * w * 0.3, cy + h * 0.95], [cx + s * w * 0.75, cy + h * 0.75]]), 1.4, { color: DARK_LINE, opacity: 0.7, transform });
      if (!p.monolid) line("eyes", "detail", spline([[cx - s * w * 0.6, cy - h * 1.25], [cx + s * w * 0.2, cy - h * 1.5], [cx + s * w * 0.9, cy - h * 1.2]]), 1.4, { color: skinLine, transform });
      continue;
    }

    const { w: baseW, h: baseH } = EYE[p.eyeSize];
    const w = comic ? baseW * 1.05 : baseW;
    const h = (p.monolid ? baseH * 0.78 : baseH) * (comic ? 0.72 : 1);
    const cy = EYE_Y;
    const inner: Point = [cx - s * w, cy];
    const outer: Point = [cx + s * w, cy - h * 0.15];
    const almond: Shape = {
      type: "path",
      d: `M${inner[0]} ${inner[1]} C${cx - s * w * 0.45} ${cy - h * 1.35} ${cx + s * w * 0.5} ${cy - h * 1.3} ${outer[0]} ${outer[1]} C${cx + s * w * 0.55} ${cy + h * 0.85} ${cx - s * w * 0.4} ${cy + h * 0.95} ${inner[0]} ${inner[1]} Z`,
    };
    if (comic) {
      // 彫りの深い目元の影
      fill("eyes", "shadow", spline([[cx - s * w * 1.2, cy - 2], [cx - s * w * 0.6, cy - 9], [cx + s * w * 0.6, cy - 10], [cx + s * w * 1.3, cy - 4], [cx + s * w * 0.6, cy - h - 2], [cx - s * w * 0.6, cy - h - 1]], true), skinShadow, {
        strokeWidth: 0,
        transform,
      });
    }
    const irisX = cx + s * w * 0.05;
    const irisY = cy - h * 0.05;
    const irisR = comic ? h * 1.25 : h * 1.05;
    fill("eyes", "sclera", almond, WHITE, { strokeWidth: 1.8, transform });
    fill("eyes", "iris", { type: "circle", cx: irisX, cy: irisY, r: irisR }, IRIS[p.eyeColor], { strokeWidth: 0, clip: almond, transform });
    fill("eyes", "pupil", { type: "circle", cx: irisX, cy: irisY, r: irisR * 0.48 }, INK, { strokeWidth: 0, clip: almond, transform });
    // まぶたの影
    fill("eyes", "shadow", { type: "ellipse", cx, cy: cy - h * 1.05, rx: w * 1.1, ry: h * 0.6 }, "#000000", { strokeWidth: 0, opacity: 0.12, clip: almond, transform });
    fill("eyes", "highlight", { type: "circle", cx: irisX + irisR * 0.33, cy: irisY - irisR * 0.43, r: irisR * 0.27 }, WHITE, { strokeWidth: 0, clip: almond, transform });
    // 上まぶたの線。目尻に向かって太くする
    const lid: Point[] = [inner, [cx - s * w * 0.4, cy - h * 1.05], [cx + s * w * 0.45, cy - h * 1.0], [outer[0] + s * 2, outer[1] - 1]];
    fill("eyes", "lash", brush(lid, (t) => (p.monolid ? 2.2 : 1.4) + (comic ? 3.2 : 2.4) * t), INK, { strokeWidth: 0, transform });
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
      line("eyes", "detail", spline([[cx - s * w * 0.75, cy - h * 1.25 - (comic ? 2 : 0)], [cx + s * w * 0.1, cy - h * 1.75 - (comic ? 3 : 0)], [cx + s * w * 0.85, cy - h * 1.3 - (comic ? 2 : 0)]]), comic ? 1.8 : 1.5, {
        color: skinLine,
        transform,
      });
    }
    line("eyes", "detail", spline([[cx - s * w * 0.7, cy + h * 0.55], [cx, cy + h * 0.85], [cx + s * w * 0.75, cy + h * 0.45]]), 1.2, { color: skinLine, opacity: 0.6, transform });
  }

  // ── 鼻 ──
  if (anime) {
    line("mouth", "nose", spline([[122, 123], [120.5, 126], [119, 127.5]]), 1.8, { color: skinLine });
  } else if (comic) {
    const k = NOSE[p.noseSize];
    line("mouth", "nose", spline([[124, 100], [126, 116], [129, 126]]), 2, { color: INK });
    line("mouth", "nose", spline([[120 - 8 * k, 127], [120 - 5 * k, 131], [120 - 1, 130.5]]), 2, { color: INK });
    line("mouth", "nose", spline([[120 + 3, 130.5], [120 + 6 * k, 131], [120 + 8 * k, 127]]), 2, { color: INK });
    fill("mouth", "shadow", spline([[110, 133], [120, 135.5], [130, 133], [120, 138]], true), skinShadow, { strokeWidth: 0 });
  } else {
    const k = NOSE[p.noseSize];
    const nostrils: Point[] = [[-7, -1], [-4, 3], [0, 2], [4, 3], [7, -1]].map(([x, y]) => [120 + x * k, 128 + y * k]);
    line("mouth", "detail", spline([[123, 104], [125, 116], [124, 123]]), 1.8, { color: skinLine, opacity: 0.35 });
    line("mouth", "nose", spline(nostrils), 2.2, { color: skinLine });
  }

  // ── あごひげと口ひげ ──
  if (p.beard === "stubble") {
    const points: Point[] = [];
    for (let i = 0; i < 160 && points.length < 70; i++) {
      const x = 120 + (rand() - 0.5) * 2 * f.cheekW;
      const y = 132 + rand() * (f.chinY - 132);
      const insideFace = Math.abs(x - 120) < faceHalfWidth(f, y) - 3;
      const onMouth = ((x - 120) / 17) ** 2 + ((y - 147) / 7) ** 2 < 1;
      if (insideFace && !onMouth) points.push([x, y]);
    }
    fill("beard", "stubble", dots(points, 0.9), bodyHair, { strokeWidth: 0, opacity: 0.55, clip: faceShape });
  } else if (p.beard === "goatee") {
    fill("beard", "facialHair", spline([[108, 153], [114, 151], [120, 152], [126, 151], [132, 153], [131, 163], [120, f.chinY + 5], [109, 163]], true), bodyHair, { strokeWidth: 2.5 });
  } else if (p.beard === "short" || p.beard === "full") {
    const full = p.beard === "full";
    const grow = full ? 8 : 3;
    const rightOuter: Point[] = [[120 + f.cheekW - 2, full ? 116 : 122], [120 + f.cheekW + (full ? 0.5 : -1.5), 134], [120 + f.jawW + grow * 0.4, f.jawY + grow * 0.4], [120 + f.chinW + grow, f.chinY + grow * 0.4]];
    const leftInner: Point[] = full ? [[120 - f.cheekW + 9, 122], [104, 138], [103, 151]] : [[120 - f.cheekW + 5, 128], [102, 146], [104, 154]];
    const underMouth: Point[] = [[112, 156], [120, 157.5], [128, 156]];
    const points = [...rightOuter, [120, f.chinY + (full ? 10 : 4)] as Point, ...mirror(rightOuter).reverse(), ...leftInner, ...underMouth, ...mirror(leftInner).reverse()];
    fill("beard", "facialHair", spline(points, true), bodyHair, { strokeWidth: 2.5 });
    if (comic) {
      for (let i = 0; i < 6; i++) {
        const x = 104 + i * 6.5;
        line("beard", "hairLine", `M${x} ${f.chinY - 2} l${(i - 2.5) * 0.8} 6`, 1.2, { color: INK, opacity: 0.6 });
      }
    }
  }
  if (p.mustache !== "none") {
    const half: Point[] =
      p.mustache === "thick" ? [[126, 132.5], [134, 133.5], [139, 139.5], [131, 140], [125, 140.5]] : [[126, 135.5], [132, 136], [135, 139], [130, 138.8], [125, 139.3]];
    const mustache: Point[] = [[120, p.mustache === "thick" ? 135.5 : 137], ...half, [120, 139.5], ...mirror(half).reverse()];
    fill("beard", "facialHair", spline(mustache, true), bodyHair, { strokeWidth: 2 });
  }

  // ── 口 ──
  const lipColor = mix(skin, LIP, comic ? 0.35 : 0.6);
  if (anime) {
    const y = 147;
    if (p.mouthOpen) {
      const mouth: Shape = {
        type: "path",
        d: p.smiling ? spline([[113, y - 2], [120, y - 1], [127, y - 2], [123, y + 6], [117, y + 6]], true) : spline(ring([120, y + 1], 8, () => 3.6), true),
      };
      fill("mouth", "mouthInside", mouth, MOUTH_INSIDE, { strokeWidth: 1.8 });
      fill("mouth", "lip", { type: "ellipse", cx: 120, cy: y + 5, rx: 4, ry: 2.5 }, "#e3707c", { strokeWidth: 0, clip: mouth });
    } else {
      line("mouth", "mouth", p.smiling ? spline([[114, y - 1], [120, y + 2.5], [126, y - 1]]) : spline([[116, y + 1], [124, y + 1]]), 2, { color: DARK_LINE });
    }
  } else if (p.mouthOpen) {
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
    if (!comic) fill("mouth", "highlight", { type: "ellipse", cx: 121, cy: 150 + lt * 0.6, rx: 3.5, ry: 1.3 }, WHITE, { strokeWidth: 0, opacity: 0.35 });
    line("mouth", "mouth", spline([left, [114, mid - 0.8], [120, mid], [126, mid - 0.8], right]), comic ? 2.8 : 2.4);
    if (comic) line("mouth", "detail", spline([[114, 155 + lt], [120, 156.5 + lt], [126, 155 + lt]]), 2, { color: INK });
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
      for (const x of [98, 142]) line("extras", "shine", spline([[x - 9, 108], [x - 4, 105], [x + 1, 104]]), 2, { color: WHITE, opacity: 0.6 });
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
