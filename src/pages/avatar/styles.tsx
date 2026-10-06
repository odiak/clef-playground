import type { ReactNode } from "react";
import { colorDistance, darken, luminance, mix } from "./color";
import { spline } from "./curves";
import { type GeometryVariant, INK, type Layer, WHITE } from "./geometry";

export type Paint = {
  fill: string;
  stroke: string;
  strokeWidth: number;
  fillOpacity?: number;
  strokeOpacity?: number;
  opacity?: number;
};

export type StyleContext = {
  /** SVG 内で一意な id を作る。同じページに複数のアバターを並べても衝突しないようにする */
  id: (name: string) => string;
};

/** パーツの形はバリエーション（geometry*.ts）で決まり、スタイルは塗り方・線の描き方・背景を決める */
export type VectorStyle = {
  /** パーツの形のバリエーション（省略時は standard） */
  variant?: GeometryVariant;
  background: (ctx: StyleContext, layers: Layer[]) => ReactNode;
  defs?: (layers: Layer[], ctx: StyleContext) => ReactNode;
  /** パーツの描き方。null なら描かない */
  paint: (layer: Layer, ctx: StyleContext) => Paint | null;
  /** 顔ができる前に出す「？」の顔の色 */
  placeholder: string;
};

const linePaint = (layer: Layer, stroke: string, strokeWidth = layer.strokeWidth): Paint => ({
  fill: "none",
  stroke,
  strokeWidth,
  opacity: layer.opacity,
});

/** 太い輪郭線とフラットな色 */
const popStyle: VectorStyle = {
  placeholder: INK,
  background: () => (
    <>
      <rect width={240} height={240} fill="#fff6ec" />
      <circle cx={120} cy={120} r={104} fill="#ffe3c8" />
    </>
  ),
  paint: (layer) =>
    layer.filled
      ? {
          fill: layer.color ?? INK,
          stroke: layer.strokeWidth > 0 ? INK : "none",
          strokeWidth: layer.strokeWidth,
          fillOpacity: layer.fillOpacity,
          opacity: layer.opacity,
        }
      : linePaint(layer, layer.color ?? INK),
};

/** 頭が大きいちびキャラ。茶色の柔らかい輪郭線 */
const CHIBI_LINE = "#5a3a2e";
const chibiStyle: VectorStyle = {
  variant: "chibi",
  placeholder: CHIBI_LINE,
  background: () => (
    <>
      <rect width={240} height={240} fill="#fff6ec" />
      <circle cx={120} cy={120} r={104} fill="#ffe3c8" />
      {[
        [40, 52, 5],
        [196, 70, 4],
        [34, 168, 3.5],
        [204, 176, 5],
      ].map(([cx, cy, r]) => (
        <path
          key={`${cx}-${cy}`}
          d={`M${cx} ${cy - r * 2} Q${cx} ${cy} ${cx + r * 2} ${cy} Q${cx} ${cy} ${cx} ${cy + r * 2} Q${cx} ${cy} ${cx - r * 2} ${cy} Q${cx} ${cy} ${cx} ${cy - r * 2} Z`}
          fill="#faae40"
        />
      ))}
    </>
  ),
  paint: (layer) =>
    layer.filled
      ? {
          fill: layer.color ?? INK,
          stroke: layer.strokeWidth > 0 ? CHIBI_LINE : "none",
          strokeWidth: layer.strokeWidth * 0.85,
          fillOpacity: layer.fillOpacity,
          opacity: layer.opacity,
        }
      : linePaint(layer, layer.color === WHITE ? WHITE : layer.color ?? CHIBI_LINE, layer.strokeWidth * 0.9),
};

/**
 * 服の色を白で薄めた背景色。白っぽい服だと背景が真っ白になるので、そのときはサイトのオレンジ系にする。
 * 輪郭線のないスタイルでは、背景が肌や髪の色に近いと頭が背景に溶け込むので、肌と髪の色から離れるまで濃さを変える。
 * 濃さを変えても離れないとき（黒い服で背景がグレーになり、白髪と重なるときなど）は、サイトのオレンジ系や青系にする
 */
function backdropColor(layers: Layer[], whiteness: number): string {
  const clothes = layers.find((layer) => layer.part === "clothes")?.color ?? "#f38020";
  const base = luminance(clothes) > 0.8 ? "#f38020" : clothes;
  const avoid = [layers.find((layer) => layer.part === "skin")?.color, layers.find((layer) => layer.part === "hair")?.color].filter((c): c is string => !!c);
  const candidates = [base, "#f38020", "#5b9be0"].flatMap((hue) => [0, -0.12, -0.24, -0.36, 0.12].map((dt) => mix(hue, "#ffffff", Math.min(0.95, whiteness + dt))));
  const score = (color: string) => Math.min(Infinity, ...avoid.map((c) => colorDistance(color, c)));
  return candidates.find((color) => score(color) >= 60) ?? candidates.reduce((a, b) => (score(a) >= score(b) ? a : b));
}

/** 点の目と輪郭線なしのフラットな塗り。背景は服の色に合わせる */
const minimalStyle: VectorStyle = {
  variant: "minimal",
  placeholder: "#3b3540",
  background: (_, layers) => <rect width={240} height={240} fill={backdropColor(layers, 0.78)} />,
  paint: (layer) =>
    layer.filled
      ? {
          fill: layer.part === "lens" && layer.color !== INK ? "none" : layer.color ?? INK,
          stroke: layer.part === "lens" ? "#3b3540" : "none",
          strokeWidth: layer.part === "lens" ? 3 : 0,
          fillOpacity: layer.fillOpacity,
          opacity: layer.opacity,
        }
      : linePaint(layer, layer.color === WHITE ? WHITE : layer.part === "brow" ? layer.color ?? "#3b3540" : "#3b3540"),
};

// フラットの背景に置く、ゆるい曲線の形
const BLOB = spline(
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
    const a = (i / 10) * Math.PI * 2;
    const r = [104, 96, 108, 100, 92, 106, 98, 110, 94, 102][i];
    return [120 + Math.cos(a) * r, 122 + Math.sin(a) * r];
  }),
  true,
);
const FLAT_LINE = "#3b2b2b";

/** 曲線を作り込んだ形に、輪郭線なしの塗りと影 */
const flatStyle: VectorStyle = {
  variant: "curvy",
  placeholder: FLAT_LINE,
  background: (_, layers) => (
    <>
      <rect width={240} height={240} fill="#fbf7f1" />
      <path d={BLOB} fill={backdropColor(layers, 0.72)} />
    </>
  ),
  paint: (layer) => {
    if (!layer.filled) return linePaint(layer, layer.color ?? FLAT_LINE);
    return {
      fill: layer.color ?? INK,
      stroke: layer.part === "lens" ? FLAT_LINE : "none",
      strokeWidth: layer.part === "lens" ? 2.5 : 0,
      fillOpacity: layer.fillOpacity,
      opacity: layer.opacity,
    };
  },
};

const ANIME_LINE = "#3a2626";

/** もくもくした雲。下を平らにした円の集まり */
function cloud(cx: number, cy: number, size: number, key: string) {
  const puffs = [
    [-1.6, 0.1, 0.55],
    [-0.8, -0.35, 0.8],
    [0.2, -0.6, 1],
    [1.1, -0.2, 0.75],
    [1.8, 0.15, 0.5],
  ];
  return (
    <g key={key} fill="#ffffff">
      {puffs.map(([dx, dy, r]) => (
        <circle key={`${dx}`} cx={cx + dx * size} cy={cy + dy * size} r={r * size} />
      ))}
      <rect x={cx - 1.9 * size} y={cy} width={3.9 * size} height={0.65 * size} rx={0.32 * size} />
    </g>
  );
}

/** ジブリ風。細い線と、境目のはっきりした影、青空と雲の背景 */
const animeStyle: VectorStyle = {
  variant: "anime",
  placeholder: ANIME_LINE,
  defs: (_, ctx) => (
    <linearGradient id={ctx.id("bg")} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#8fcaf0" />
      <stop offset="0.7" stopColor="#d4ecf8" />
      <stop offset="1" stopColor="#eef8fc" />
    </linearGradient>
  ),
  background: (ctx) => (
    <>
      <rect width={240} height={240} fill={`url(#${ctx.id("bg")})`} />
      <g opacity={0.95}>
        {cloud(36, 178, 22, "left")}
        {cloud(212, 150, 18, "right")}
        {cloud(196, 40, 9, "top")}
      </g>
    </>
  ),
  paint: (layer) => {
    if (!layer.filled) return linePaint(layer, layer.color ?? ANIME_LINE, layer.strokeWidth * 0.85);
    const color = layer.color ?? INK;
    return {
      fill: color,
      stroke: layer.strokeWidth > 0 ? (layer.part === "lens" ? ANIME_LINE : darken(color, 0.5)) : "none",
      strokeWidth: layer.strokeWidth > 0 ? (layer.part === "lens" ? 2.2 : 1.8) : 0,
      fillOpacity: layer.fillOpacity,
      opacity: layer.opacity,
    };
  },
};

/** アメコミ風。太い黒の輪郭線と、網点（スクリーントーン）の影、集中線の背景（帽子や肌の暖色が映えるよう寒色） */
const comicStyle: VectorStyle = {
  variant: "comic",
  placeholder: INK,
  defs: (layers, ctx) => {
    const shadows = new Set(layers.filter((l) => l.part === "shadow" && l.color && l.color !== "#000000").map((l) => l.color!));
    return (
      <>
        {[...shadows].map((color) => (
          <pattern key={color} id={ctx.id(`ht${color.slice(1)}`)} width={4.5} height={4.5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={4.5} height={4.5} fill={color} />
            <circle cx={2.25} cy={2.25} r={1.25} fill={INK} opacity={0.5} />
          </pattern>
        ))}
        <pattern id={ctx.id("bgdots")} width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx={3.5} cy={3.5} r={1.8} fill="#1f6fd1" opacity={0.35} />
        </pattern>
      </>
    );
  },
  background: (ctx) => (
    <>
      <rect width={240} height={240} fill="#7fd4ff" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const b = a + Math.PI / 16;
        return <path key={i} d={`M120 110 L${120 + Math.cos(a) * 240} ${110 + Math.sin(a) * 240} L${120 + Math.cos(b) * 240} ${110 + Math.sin(b) * 240} Z`} fill="#3b9cf0" opacity={0.55} />;
      })}
      <rect width={240} height={240} fill={`url(#${ctx.id("bgdots")})`} />
    </>
  ),
  paint: (layer, ctx) => {
    if (!layer.filled) return linePaint(layer, layer.color === WHITE ? WHITE : INK, layer.strokeWidth * 1.1);
    const color = layer.color ?? INK;
    const halftone = layer.part === "shadow" && color !== "#000000";
    return {
      fill: halftone ? `url(#${ctx.id(`ht${color.slice(1)}`)})` : color,
      stroke: layer.strokeWidth > 0 ? INK : "none",
      strokeWidth: layer.strokeWidth > 0 ? Math.max(2.5, layer.strokeWidth * 1.25) : 0,
      fillOpacity: layer.fillOpacity,
      opacity: layer.opacity,
    };
  },
};

export const VECTOR_STYLES = {
  pop: popStyle,
  chibi: chibiStyle,
  minimal: minimalStyle,
  flat: flatStyle,
  anime: animeStyle,
  comic: comicStyle,
} satisfies Record<string, VectorStyle>;

export type VectorStyleId = keyof typeof VECTOR_STYLES;
