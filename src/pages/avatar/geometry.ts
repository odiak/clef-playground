import type { AvatarStageId, OptionId } from "../../../shared/avatar";
import { darken } from "./color";
import { buildCurvyLayers } from "./geometryCurvy";
import { BLUSH, CLOTHES, FRECKLE, GOLD, HAIR, INK, IRIS, LIP, MOUTH_INSIDE, SKIN, WHITE } from "./palette";
import type { AvatarParams } from "./params";

// アバターの形（どこに何を描くか）だけを決める。色の塗り方や線の描き方はスタイル（styles.ts）が決める

export { INK, WHITE } from "./palette";

export type Shape =
  | { type: "path"; d: string }
  | { type: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { type: "circle"; cx: number; cy: number; r: number }
  | { type: "rect"; x: number; y: number; width: number; height: number; rx?: number };

/** パーツの役割。スタイルが役割ごとに塗り方を変えるのに使う */
export type Part =
  | "skin"
  | "hair"
  | "hairLine"
  | "clothes"
  | "brow"
  | "iris"
  | "pupil"
  | "highlight"
  | "eyeLine"
  | "nose"
  | "mouth"
  | "mouthInside"
  | "teeth"
  | "lip"
  | "blush"
  | "freckle"
  | "stubble"
  | "facialHair"
  | "earring"
  | "lens"
  | "frame"
  | "shine"
  | "hat"
  | "hatShade"
  | "shadow"
  | "hairHighlight"
  | "lash"
  | "sclera"
  | "detail";

export type Layer = {
  stage: AvatarStageId;
  part: Part;
  shape: Shape;
  /** true なら塗り、false なら線だけ */
  filled: boolean;
  /** 塗りの色。線だけのパーツでは線の色（省略時は輪郭線の色） */
  color?: string;
  /** 線の太さ。塗りのパーツでは輪郭線の太さ（0 で輪郭線なし） */
  strokeWidth: number;
  fillOpacity?: number;
  opacity?: number;
  transform?: string;
  /** この形で切り抜く */
  clip?: Shape;
};


const HEAD: Record<OptionId<"face_shape">, { halfWidth: number; shape: Shape }> = {
  round: { halfWidth: 54, shape: { type: "ellipse", cx: 120, cy: 112, rx: 54, ry: 58 } },
  oval: {
    halfWidth: 50,
    shape: { type: "path", d: "M120 52 C152 52 170 78 170 108 C170 144 146 172 120 172 C94 172 70 144 70 108 C70 78 88 52 120 52 Z" },
  },
  square: {
    halfWidth: 52,
    shape: { type: "path", d: "M68 82 C68 62 86 54 120 54 C154 54 172 62 172 82 L172 128 C172 156 150 168 120 168 C90 168 68 156 68 128 Z" },
  },
  long: { halfWidth: 46, shape: { type: "ellipse", cx: 120, cy: 112, rx: 46, ry: 64 } },
};

const HAIR_CAP_TOP = "M64 118 C58 56 92 34 120 34 C148 34 182 56 176 118";
const HAIR_CAP_EDGE: Record<OptionId<"bangs">, string> = {
  none: " C172 92 154 64 120 64 C86 64 68 92 64 118 Z",
  full: " C176 102 170 88 160 86 L80 86 C70 88 64 102 64 118 Z",
  side: " C174 96 164 72 140 68 C118 70 92 80 80 94 C70 104 66 110 64 118 Z",
};
const BUZZ = "M70 110 C66 60 94 42 120 42 C146 42 174 60 170 110 C166 84 150 62 120 62 C90 62 74 84 70 110 Z";

const HAIR_BACK = {
  medium: "M64 100 C60 136 62 160 74 176 L166 176 C178 160 180 136 176 100 Z",
  long: "M62 98 C56 150 58 196 72 214 L168 214 C182 196 184 150 178 98 Z",
};
const FRONT_LOCKS = {
  medium: ["M66 108 C62 140 64 162 72 174 L88 172 C82 156 80 136 82 114 Z", "M174 108 C178 140 176 162 168 174 L152 172 C158 156 160 136 158 114 Z"],
  long: ["M66 108 C60 150 62 190 74 210 L92 206 C82 180 80 150 82 114 Z", "M174 108 C180 150 178 190 166 210 L148 206 C158 180 160 150 158 114 Z"],
};

const EYE_SIZE: Record<OptionId<"eye_size">, number> = { small: 5.5, medium: 7, large: 9 };
const EYE_SLANT: Record<OptionId<"eye_slant">, number> = { droopy: 12, level: 0, upturned: -12 };
const BROW_WIDTH: Record<OptionId<"brow_thickness">, number> = { thin: 3, medium: 5, thick: 7.5 };
const NOSE: Record<OptionId<"nose_size">, string> = {
  small: "M120 120 Q117 127 121 129",
  medium: "M120 116 Q114 128 122 130",
  large: "M120 112 Q109 130 123 133",
};

const LEFT_EYE = 98;
const RIGHT_EYE = 142;
const EYE_Y = 112;

const path = (d: string): Shape => ({ type: "path", d });
const circle = (cx: number, cy: number, r: number): Shape => ({ type: "circle", cx, cy, r });
const ellipse = (cx: number, cy: number, rx: number, ry: number): Shape => ({ type: "ellipse", cx, cy, rx, ry });

/** パーツの形のバリエーション */
export type GeometryVariant = "standard" | "chibi" | "minimal" | "curvy" | "anime" | "comic";

// 立てた髪（ツンツン頭）
const SPIKY = "M64 118 C60 82 64 60 76 48 L82 30 L94 42 L104 22 L116 38 L128 20 L138 38 L150 26 L156 44 C170 56 180 82 176 118 C172 92 154 64 120 64 C86 64 68 92 64 118 Z";
// まとめ髪
const PONYTAIL = "M156 50 C194 56 206 108 190 156 C186 136 180 112 166 90 Z";
const TWINTAIL = "M68 72 C32 80 26 140 42 180 C50 152 58 122 74 96 Z";
// 耳にかかる短い横髪
const SIDE_LOCK = "M64 100 C60 116 62 128 70 136 L78 132 C74 120 74 110 76 100 Z";

const MUSTACHE: Record<"thin" | "thick", { d: string; strokeWidth: number }> = {
  thin: { d: "M108 138 C114 134 118 135 120 137 C122 135 126 134 132 138 C126 139.5 122 139 120 138.5 C118 139 114 139.5 108 138 Z", strokeWidth: 1.5 },
  thick: { d: "M102 138 C108 129 116 131 120 135 C124 131 132 129 138 138 C131 143 124 141 120 139 C116 141 109 143 102 138 Z", strokeWidth: 2 },
};
const BEARD = {
  goatee: "M108 152 Q120 149 132 152 Q133 166 120 172 Q107 166 108 152 Z",
  short: "M80 128 C82 158 102 172 120 172 C138 172 158 158 160 128 C154 148 140 156 120 156 C100 156 86 148 80 128 Z",
  full: "M76 122 C78 160 100 176 120 176 C140 176 162 160 164 122 C156 150 140 158 120 158 C100 158 84 150 76 122 Z",
};

/** パラメーターから、奥から順に描くパーツの一覧を作る */
export function buildLayers(p: AvatarParams, variant: GeometryVariant = "standard"): Layer[] {
  if (variant === "curvy" || variant === "anime" || variant === "comic") return buildCurvyLayers(p, variant);
  const layers: Layer[] = [];
  // 首と服のパーツ。ちびキャラでは頭だけを大きくするので区別する
  const bodyLayers = new Set<Layer>();
  // 髪のパーツ。髪のボリュームに合わせて大きさを変える
  const hairLayers = new Set<Layer>();
  const add = (stage: AvatarStageId, part: Part, shape: Shape, options: Partial<Layer> & { filled: boolean }) => {
    const layer: Layer = { stage, part, shape, strokeWidth: 4, ...options };
    layers.push(layer);
    if (part === "hair" || part === "hairLine") hairLayers.add(layer);
    return layer;
  };
  const fill = (stage: AvatarStageId, part: Part, shape: Shape, color: string, options: Partial<Layer> = {}) =>
    add(stage, part, shape, { filled: true, color, ...options });
  const line = (stage: AvatarStageId, part: Part, d: string, strokeWidth: number, options: Partial<Layer> = {}) =>
    add(stage, part, path(d), { filled: false, strokeWidth, ...options });

  const chibi = variant === "chibi";
  const minimal = variant === "minimal";

  const skin = SKIN[p.skinTone];
  const hair = HAIR[p.hairColor];
  // 眉やひげの色。髪がない人や、髪を派手な色に染めている人はこげ茶にする
  const bodyHair = p.hairLength === "bald" || p.hairColor === "colorful" ? HAIR.dark_brown : hair;
  const head = HEAD[p.faceShape];
  const hasLongHair = p.hairLength === "medium" || p.hairLength === "long";
  const updo = hasLongHair ? p.hairUpdo : "none";
  const hairBack = hasLongHair && updo === "none" ? (p.hairLength as "medium" | "long") : null;
  // 帽子をかぶっていると髪は立たないので、立てた髪は帽子がないときだけ描く
  const spiky = p.hairStyledUp && (p.hairLength === "short" || p.hairLength === "medium") && updo === "none" && p.hat === "none";
  const eyeY = chibi ? 116 : minimal ? 114 : EYE_Y;

  // まとめ髪と後ろ髪
  if (updo === "bun" && p.hat === "none") fill("hairstyle", "hair", circle(120, 30, 17), hair);
  if (updo === "ponytail") fill("hairstyle", "hair", path(PONYTAIL), hair);
  if (updo === "twintails") {
    fill("hairstyle", "hair", path(TWINTAIL), hair);
    fill("hairstyle", "hair", path(TWINTAIL), hair, { transform: "matrix(-1 0 0 1 240 0)" });
  }
  if (hairBack && !spiky) {
    fill("hair", "hair", path(HAIR_BACK[hairBack]), hair);
    if (p.hairTexture === "curly") {
      for (const y of [100, 130, 160, ...(hairBack === "long" ? [190] : [])]) {
        fill("hair", "hair", circle(62, y, 13), hair);
        fill("hair", "hair", circle(178, y, 13), hair);
      }
    }
  }

  // 首と服
  if (chibi) {
    bodyLayers.add(fill("face", "skin", { type: "rect", x: 100, y: 172, width: 40, height: 26 }, skin));
    bodyLayers.add(fill("clothes", "clothes", path("M50 240 C54 214 76 198 100 195 L140 195 C164 198 186 214 190 240 Z"), CLOTHES[p.clothingColor]));
    bodyLayers.add(fill("clothes", "skin", path("M100 195 Q120 211 140 195 Z"), skin));
  } else {
    bodyLayers.add(fill("face", "skin", { type: "rect", x: 99, y: 146, width: 42, height: 36 }, skin));
    bodyLayers.add(fill("clothes", "clothes", path("M30 240 C34 202 62 182 99 178 L141 178 C178 182 206 202 210 240 Z"), CLOTHES[p.clothingColor]));
    bodyLayers.add(fill("clothes", "skin", path("M99 178 Q120 196 141 178 Z"), skin));
  }

  // 耳とピアス
  fill("face", "skin", circle(120 - head.halfWidth - 1, 116, 11), skin);
  fill("face", "skin", circle(120 + head.halfWidth + 1, 116, 11), skin);
  if (p.earrings) {
    fill("extras", "earring", circle(120 - head.halfWidth - 3, 131, 4), GOLD, { strokeWidth: 2 });
    fill("extras", "earring", circle(120 + head.halfWidth + 3, 131, 4), GOLD, { strokeWidth: 2 });
  }

  // 耳にかかる横髪
  if (p.earsCovered && !spiky) {
    if (hairBack) for (const d of FRONT_LOCKS[hairBack]) fill("hairstyle", "hair", path(d), hair);
    else if (p.hairLength === "short") {
      fill("hairstyle", "hair", path(SIDE_LOCK), hair);
      fill("hairstyle", "hair", path(SIDE_LOCK), hair, { transform: "matrix(-1 0 0 1 240 0)" });
    }
  }

  // もみあげ
  if (p.sideburns && p.hairLength !== "bald") {
    for (const s of [-1, 1]) {
      const x = 120 + s * (head.halfWidth - 1);
      fill("beard", "facialHair", path(`M${x} 98 L${x - s * 8} 100 L${x - s * 9} 126 Q${x - s * 5} 131 ${x - s * 1} 126 Z`), bodyHair, { strokeWidth: 2.5 });
    }
  }

  // 顔
  fill("face", "skin", head.shape, skin);

  // ほっぺ
  const blushY = chibi ? 132 : 130;
  for (const cx of [86, 154]) {
    const [rx, ry] = chibi ? [12, 7] : [10, 6];
    const opacity = chibi ? (p.rosyCheeks ? 0.7 : 0.4) : p.rosyCheeks ? 0.55 : 0.18;
    fill("cheeks", "blush", ellipse(cx, blushY, rx, ry), BLUSH, { strokeWidth: 0, opacity });
  }
  if (p.freckles) {
    for (const [cx, cy] of [
      [82, 124],
      [89, 127],
      [84, 131],
      [151, 127],
      [158, 124],
      [156, 131],
    ]) {
      fill("cheeks", "freckle", circle(cx, cy, 1.7), FRECKLE, { strokeWidth: 0, opacity: 0.75 });
    }
  }

  // 頭の髪と前髪
  if (p.hairLength === "bald") {
    line("hair", "shine", "M96 66 Q108 58 122 60", 4, { color: WHITE, opacity: 0.7 });
  } else if (p.hairLength === "buzz") {
    fill("hair", "hair", path(BUZZ), hair, { fillOpacity: 0.9 });
  } else if (spiky) {
    fill("hairstyle", "hair", path(SPIKY), hair);
  } else {
    if (p.hairTexture === "curly") {
      for (const deg of [200, 222, 245, 270, 295, 318, 340]) {
        const rad = (deg * Math.PI) / 180;
        fill("hair", "hair", circle(120 + 58 * Math.cos(rad), 104 + 66 * Math.sin(rad), 13), hair);
      }
    }
    fill("hair", "hair", path(HAIR_CAP_TOP + HAIR_CAP_EDGE.none), hair);
    // 流した前髪は、分け目が右寄りなら左右を反転する
    if (p.bangs !== "none") {
      fill("hairstyle", "hair", path(HAIR_CAP_TOP + HAIR_CAP_EDGE[p.bangs]), hair, {
        transform: p.bangs === "side" && p.hairParting === "right" ? "matrix(-1 0 0 1 240 0)" : undefined,
      });
    } else if (p.hairParting !== "none") {
      const x = { center: 120, left: 100, right: 140 }[p.hairParting];
      line("hairstyle", "hairLine", `M${x} 38 Q${x - 2} 50 ${x} 64`, 2.5, { opacity: 0.5 });
    }
    if (p.hairTexture === "wavy") {
      line("hair", "hairLine", "M84 52 q8 6 16 0 t16 0", 2.5, { opacity: 0.35 });
      line("hair", "hairLine", "M122 46 q8 6 16 0 t16 0", 2.5, { opacity: 0.35 });
    }
  }

  // 眉
  const brows = chibi
    ? p.browShape === "arched"
      ? ["M90 99 Q97 94 104 97", "M136 97 Q143 94 150 99"]
      : ["M90 98 L104 97", "M136 97 L150 98"]
    : p.browShape === "arched"
      ? ["M86 98 Q98 88 110 95", "M130 95 Q142 88 154 98"]
      : ["M87 96 L109 94", "M131 94 L153 96"];
  const browScale = chibi || minimal ? 0.75 : 1;
  for (const d of brows) line("brows", "brow", d, BROW_WIDTH[p.browThickness] * browScale, { color: bodyHair });

  // 目
  for (const [cx, side] of [
    [LEFT_EYE, -1],
    [RIGHT_EYE, 1],
  ] as const) {
    const transform = `rotate(${EYE_SLANT[p.eyeSlant] * side} ${cx} ${eyeY})`;
    if (minimal) {
      // 二重は点の目、一重は線の目
      if (p.monolid) line("eyes", "eyeLine", `M${cx - 5} ${eyeY} L${cx + 5} ${eyeY}`, 3.5, { transform });
      else fill("eyes", "pupil", circle(cx, eyeY, EYE_SIZE[p.eyeSize] * 0.65), INK, { strokeWidth: 0 });
      continue;
    }
    const rx = EYE_SIZE[p.eyeSize] * (chibi ? 1.35 : 1);
    const ry = p.monolid ? rx * (chibi ? 0.95 : 0.8) : rx * (chibi ? 1.15 : 1.1);
    fill("eyes", "iris", ellipse(cx, eyeY, rx, ry), IRIS[p.eyeColor], { strokeWidth: 2.5, transform });
    fill("eyes", "pupil", ellipse(cx, eyeY, rx * 0.5, ry * 0.5), INK, { strokeWidth: 0, transform });
    fill("eyes", "highlight", circle(cx + rx * 0.3, eyeY - ry * 0.35, rx * (chibi ? 0.38 : 0.32)), WHITE, { strokeWidth: 0, transform });
    if (chibi) fill("eyes", "highlight", circle(cx - rx * 0.3, eyeY + ry * 0.4, rx * 0.16), WHITE, { strokeWidth: 0, transform });
    if (p.monolid) {
      line("eyes", "eyeLine", `M${cx - rx - 2} ${eyeY - ry * 0.4} Q${cx} ${eyeY - ry - 3} ${cx + rx + 2} ${eyeY - ry * 0.4}`, 3, { transform });
    } else if (!chibi) {
      line("eyes", "eyeLine", `M${cx - rx - 1} ${eyeY - ry - 3} Q${cx} ${eyeY - ry - 9} ${cx + rx + 1} ${eyeY - ry - 3}`, 2, { transform });
    }
    if (p.longLashes) {
      line("eyes", "eyeLine", `M${cx + side * rx * 0.9} ${eyeY - ry * 0.6} l${side * 5} -4`, 2, { transform });
      line("eyes", "eyeLine", `M${cx + side * rx * 0.5} ${eyeY - ry * 0.95} l${side * 3} -5`, 2, { transform });
    }
  }

  // 鼻
  if (chibi) fill("mouth", "nose", circle(120, 128, 1.6), darken(skin, 0.35), { strokeWidth: 0 });
  else if (!minimal) line("mouth", "nose", NOSE[p.noseSize], 3);

  // あごひげと口ひげ
  if (p.beard === "stubble") fill("beard", "stubble", path(BEARD.full), bodyHair, { strokeWidth: 0, fillOpacity: 0.28 });
  else if (p.beard !== "none") fill("beard", "facialHair", path(BEARD[p.beard]), bodyHair, { strokeWidth: 3 });
  if (p.mustache !== "none") {
    const { d, strokeWidth } = MUSTACHE[p.mustache];
    // ちびキャラは口が高い位置にあるので、口ひげも上げる
    fill("beard", "facialHair", path(d), bodyHair, { strokeWidth, transform: chibi ? "translate(0 -5)" : undefined });
  }

  // 口
  if (chibi) {
    const y = 138;
    if (p.mouthOpen && p.smiling) {
      fill("mouth", "mouthInside", path(`M111 ${y - 4} Q120 ${y + 9} 129 ${y - 4} Z`), MOUTH_INSIDE, { strokeWidth: 2.5 });
      fill("mouth", "lip", ellipse(120, y + 1.5, 4.5, 2.5), LIP, { strokeWidth: 0 });
    } else if (p.mouthOpen) {
      fill("mouth", "mouthInside", ellipse(120, y, 4, 5.5), MOUTH_INSIDE, { strokeWidth: 2.5 });
    } else {
      line("mouth", "mouth", p.smiling ? `M113 ${y - 2} Q120 ${y + 4} 127 ${y - 2}` : `M115 ${y} Q120 ${y + 1} 125 ${y}`, 2.8);
    }
  } else if (minimal) {
    if (p.mouthOpen) fill("mouth", "mouthInside", path("M110 140 Q120 154 130 140 Z"), INK, { strokeWidth: 0 });
    else line("mouth", "mouth", p.smiling ? "M108 140 Q120 151 132 140" : "M112 144 L128 144", 3.5);
  } else if (p.mouthOpen && p.smiling) {
    fill("mouth", "mouthInside", path("M106 140 Q120 162 134 140 Z"), MOUTH_INSIDE, { strokeWidth: 3 });
    fill("mouth", "teeth", path("M108 141 L132 141 L130 145 Q120 147 110 145 Z"), WHITE, { strokeWidth: 0 });
  } else if (p.mouthOpen) {
    fill("mouth", "mouthInside", ellipse(120, 146, 6, 8), MOUTH_INSIDE, { strokeWidth: 3 });
  } else {
    if (p.lipThickness === "full") fill("mouth", "lip", path("M108 143 Q120 137 132 143 Q120 155 108 143 Z"), LIP, { strokeWidth: 2.5 });
    line("mouth", "mouth", p.smiling ? "M106 140 Q120 154 134 140" : "M110 144 Q120 147 130 144", p.lipThickness === "thin" ? 3 : 3.5);
  }

  // メガネ
  if (p.glasses !== "none") {
    const sunglasses = p.glasses === "sunglasses";
    const lensSize = chibi ? 1.25 : 1;
    for (const cx of [LEFT_EYE, RIGHT_EYE]) {
      const lens: Shape =
        p.glasses === "round"
          ? circle(cx, eyeY, 14 * lensSize)
          : { type: "rect", x: cx - 15 * lensSize, y: eyeY - 11 * lensSize, width: 30 * lensSize, height: 22 * lensSize, rx: sunglasses ? 8 : 4 };
      fill("extras", "lens", lens, sunglasses ? INK : WHITE, { strokeWidth: 3.5, fillOpacity: sunglasses ? 0.92 : 0.2 });
    }
    line("extras", "frame", `M${LEFT_EYE + 14 * lensSize} ${eyeY - 2} Q120 ${eyeY - 7} ${RIGHT_EYE - 14 * lensSize} ${eyeY - 2}`, 3.5);
    line("extras", "frame", `M${LEFT_EYE - 15 * lensSize} ${eyeY - 3} L${120 - head.halfWidth} ${eyeY - 6}`, 3.5);
    line("extras", "frame", `M${RIGHT_EYE + 15 * lensSize} ${eyeY - 3} L${120 + head.halfWidth} ${eyeY - 6}`, 3.5);
    if (sunglasses) {
      line("extras", "shine", `M${LEFT_EYE - 8} ${eyeY - 6} l6 -3`, 2, { color: WHITE, opacity: 0.6 });
      line("extras", "shine", `M${RIGHT_EYE - 8} ${eyeY - 6} l6 -3`, 2, { color: WHITE, opacity: 0.6 });
    }
  }

  // 帽子
  if (p.hat === "cap") {
    fill("extras", "hat", path("M62 94 C60 50 90 30 120 30 C150 30 180 50 178 94 Z"), "#f38020");
    fill("extras", "hatShade", path("M62 94 Q120 82 178 94 Q182 108 120 102 Q58 108 62 94 Z"), "#c95f0a");
    fill("extras", "hatShade", circle(120, 31, 4), "#c95f0a", { strokeWidth: 2.5 });
  } else if (p.hat === "beanie") {
    fill("extras", "hat", circle(120, 22, 11), "#faae40");
    fill("extras", "hat", path("M62 92 C60 48 90 28 120 28 C150 28 180 48 178 92 Z"), "#faae40");
    fill("extras", "hatShade", { type: "rect", x: 58, y: 84, width: 124, height: 18, rx: 9 }, "#f38020");
  }

  // 髪のボリュームに合わせて、髪のパーツを少し縮めたり膨らませたりする
  const volume = { flat: "translate(120 100) scale(0.95 0.97) translate(-120 -100)", normal: null, full: "translate(120 100) scale(1.08 1.06) translate(-120 -100)" }[
    p.hairVolume
  ];
  // ちびキャラは頭を大きくする。帽子が上で切れないよう、少し下げる
  const chibiScale = chibi ? "translate(0 7) translate(120 104) scale(1.16) translate(-120 -104)" : null;
  for (const layer of layers) {
    const transforms = [
      !bodyLayers.has(layer) ? chibiScale : null,
      hairLayers.has(layer) ? volume : null,
      layer.transform ?? null,
    ].filter(Boolean);
    layer.transform = transforms.length ? transforms.join(" ") : undefined;
  }

  return layers;
}

/** 輪郭だけの「？」の顔。顔の段階を描く前に表示する */
export const PLACEHOLDER_HEAD: Shape = ellipse(120, 112, 52, 58);
