import type { ReactNode } from "react";
import { darken, fromHsl, lighten, luminance, mix, toHsl } from "./color";
import { type GeometryVariant, INK, type Layer, type Part, WHITE } from "./geometry";

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

/** パーツの形は共通で、塗り方・線の描き方・背景・効果だけを変える */
export type VectorStyle = {
  /** パーツの形のバリエーション（省略時は standard） */
  variant?: GeometryVariant;
  background: (ctx: StyleContext, layers: Layer[]) => ReactNode;
  defs?: (layers: Layer[], ctx: StyleContext) => ReactNode;
  /** パーツの描き方。null なら描かない */
  paint: (layer: Layer, ctx: StyleContext) => Paint | null;
  /** アバター全体にかけるフィルター */
  filter?: (ctx: StyleContext) => string;
  /** アバターの上に重ねるもの（紙の質感など） */
  overlay?: (ctx: StyleContext) => ReactNode;
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
export function popStyle(outlineScale = 1): VectorStyle {
  return {
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
            strokeWidth: layer.strokeWidth * outlineScale,
            fillOpacity: layer.fillOpacity,
            opacity: layer.opacity,
          }
        : linePaint(layer, layer.color ?? INK, layer.strokeWidth * outlineScale),
  };
}

/** 輪郭線なしで、グラデーションと影でぷっくりさせる */
const softStyle: VectorStyle = {
  placeholder: "#b98a6a",
  background: (ctx) => (
    <>
      <rect width={240} height={240} fill={`url(#${ctx.id("bg")})`} />
      <circle cx={120} cy={120} r={104} fill="#ffffff" opacity={0.45} />
    </>
  ),
  defs: (layers, ctx) => {
    const colors = new Set(layers.filter((l) => l.filled && l.color).map((l) => l.color!));
    return (
      <>
        <linearGradient id={ctx.id("bg")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3e6" />
          <stop offset="1" stopColor="#ffd2ae" />
        </linearGradient>
        {[...colors].map((color) => (
          <radialGradient key={color} id={ctx.id(`g${color.slice(1)}`)} cx="38%" cy="30%" r="80%">
            <stop offset="0" stopColor={lighten(color, 0.35)} />
            <stop offset="0.55" stopColor={color} />
            <stop offset="1" stopColor={darken(color, 0.22)} />
          </radialGradient>
        ))}
        <filter id={ctx.id("shadow")} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#7a4a2a" floodOpacity="0.28" />
        </filter>
      </>
    );
  },
  filter: (ctx) => `url(#${ctx.id("shadow")})`,
  paint: (layer, ctx) => {
    if (!layer.filled) {
      const stroke = layer.part === "frame" ? "#3a3340" : layer.color ? darken(layer.color, 0.1) : "#5b4848";
      return linePaint(layer, stroke, layer.strokeWidth * 0.9);
    }
    const color = layer.color ?? INK;
    const flat = new Set<Part>(["pupil", "highlight", "blush", "freckle", "teeth", "stubble"]);
    return {
      fill: flat.has(layer.part) ? color : `url(#${ctx.id(`g${color.slice(1)}`)})`,
      stroke: layer.part === "lens" ? "#3a3340" : layer.strokeWidth > 0 ? darken(color, 0.28) : "none",
      strokeWidth: layer.part === "lens" ? 3 : 1.4,
      fillOpacity: layer.fillOpacity,
      opacity: layer.opacity,
    };
  },
};

/** モノクロの線画 */
const lineartStyle: VectorStyle = {
  placeholder: INK,
  background: () => (
    <>
      <rect width={240} height={240} fill="#ffffff" />
      <circle cx={120} cy={120} r={104} fill="#f4f4f5" />
    </>
  ),
  paint: (layer) => {
    if (!layer.filled) {
      return linePaint(layer, layer.color === WHITE ? WHITE : INK, layer.part === "brow" ? layer.strokeWidth : Math.max(2.5, layer.strokeWidth * 0.85));
    }
    const gray = (color: string) => {
      const l = luminance(color);
      return l < 0.35 ? INK : l < 0.6 ? "#6b6b72" : "#d6d6db";
    };
    const fills: Partial<Record<Part, string | null>> = {
      hair: gray(layer.color ?? INK),
      facialHair: gray(layer.color ?? INK),
      stubble: INK,
      iris: INK,
      pupil: INK,
      highlight: WHITE,
      mouthInside: INK,
      freckle: INK,
      hatShade: "#d6d6db",
      blush: null,
      lens: layer.color === INK ? INK : WHITE,
    };
    const fill = layer.part in fills ? fills[layer.part] : WHITE;
    if (fill === null || fill === undefined) return null;
    return {
      fill,
      stroke: layer.strokeWidth > 0 ? INK : "none",
      strokeWidth: Math.max(2.5, layer.strokeWidth * 0.85),
      fillOpacity: layer.part === "stubble" ? 0.15 : layer.part === "lens" && layer.color !== INK ? 0 : layer.fillOpacity,
      opacity: layer.opacity,
    };
  },
};

/** にじんだ輪郭と透けた色の水彩 */
const watercolorStyle: VectorStyle = {
  placeholder: "#b9a593",
  background: (ctx) => (
    <>
      <rect width={240} height={240} fill="#fbf6ec" />
      <rect width={240} height={240} filter={`url(#${ctx.id("paper")})`} />
      <circle cx={120} cy={120} r={100} fill="#ffd9b8" opacity={0.55} filter={`url(#${ctx.id("wc")})`} />
    </>
  ),
  defs: (_, ctx) => (
    <>
      <filter id={ctx.id("wc")} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id={ctx.id("paper")} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.4  0 0 0 0 0.3  0.25 0 0 0 0" />
      </filter>
    </>
  ),
  filter: (ctx) => `url(#${ctx.id("wc")})`,
  overlay: (ctx) => <rect width={240} height={240} filter={`url(#${ctx.id("paper")})`} opacity={0.5} />,
  paint: (layer) => {
    if (!layer.filled) {
      const stroke = layer.color === WHITE ? WHITE : layer.color ? darken(layer.color, 0.15) : "#4a3a3a";
      return { ...linePaint(layer, stroke, layer.strokeWidth * 0.85), strokeOpacity: 0.85 };
    }
    const color = layer.color ?? INK;
    if (layer.part === "lens") {
      return { fill: color, stroke: "#4a3a3a", strokeWidth: 2.5, fillOpacity: color === INK ? 0.8 : 0.15, opacity: layer.opacity };
    }
    return {
      fill: color,
      stroke: layer.strokeWidth > 0 ? darken(color, 0.35) : "none",
      strokeWidth: 2,
      strokeOpacity: 0.6,
      // 肌は首・耳・顔が重なる部分が透けて見えないよう不透明にする
      fillOpacity: (layer.fillOpacity ?? 1) * (layer.part === "skin" || layer.part === "highlight" || layer.part === "pupil" ? 1 : 0.92),
      opacity: layer.opacity,
    };
  },
};

const NEON_BG = "#16131f";

/** 色相だけを残して、ネオンらしい鮮やかな明るい色にする。無彩色はパーツごとの色相を使う */
function neon(color: string, fallbackHue: number): string {
  const [h, s] = toHsl(color);
  return fromHsl(s < 0.15 ? fallbackHue : h, 1, 0.62);
}

/** 暗い背景に光る線 */
const neonStyle: VectorStyle = {
  placeholder: "#7df9ff",
  background: () => (
    <>
      <rect width={240} height={240} fill={NEON_BG} />
      <circle cx={120} cy={120} r={104} fill="#211b33" />
    </>
  ),
  defs: (_, ctx) => (
    <filter id={ctx.id("glow")} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.2" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  ),
  filter: (ctx) => `url(#${ctx.id("glow")})`,
  paint: (layer) => {
    const color = layer.color ?? INK;
    if (!layer.filled) {
      const stroke =
        layer.color === WHITE
          ? WHITE
          : layer.part === "brow"
            ? neon(color, 285)
            : layer.part === "frame"
              ? "#ffe066"
              : layer.part === "hairLine"
                ? neon(color, 285)
                : "#e8f8ff";
      return linePaint(layer, stroke, layer.strokeWidth * (layer.part === "brow" ? 0.7 : 0.8));
    }
    switch (layer.part) {
      case "pupil":
        return { fill: NEON_BG, stroke: "none", strokeWidth: 0 };
      case "highlight":
      case "teeth":
        return { fill: WHITE, stroke: "none", strokeWidth: 0, opacity: 0.9 };
      case "blush":
        return { fill: "#ff5fa2", stroke: "none", strokeWidth: 0, opacity: layer.opacity };
      case "freckle":
        return { fill: "#ffb36b", stroke: "none", strokeWidth: 0, opacity: layer.opacity };
      case "stubble":
        return { fill: neon(color, 285), stroke: "none", strokeWidth: 0, fillOpacity: 0.18 };
    }
    const hues: Partial<Record<Part, number>> = { hair: 285, facialHair: 285, clothes: 195, iris: 200, hat: 30, hatShade: 30 };
    const stroke =
      layer.part === "skin" ? "#7df9ff" : layer.part === "lens" || layer.part === "earring" ? "#ffe066" : neon(color, hues[layer.part] ?? 190);
    return {
      fill: layer.part === "lens" ? (color === INK ? NEON_BG : "none") : mix(NEON_BG, stroke, layer.part === "mouthInside" ? 0.45 : 0.16),
      stroke,
      strokeWidth: layer.strokeWidth > 0 ? 2.2 : 0,
      opacity: layer.opacity,
    };
  },
};

const ILLUST_LINE = "#4a2f2f";

/** アニメ風の形に、塗り色を濃くした色の線と影の塗り分け */
const illustStyle: VectorStyle = {
  variant: "anime",
  placeholder: "#b98a6a",
  background: (ctx) => (
    <>
      <rect width={240} height={240} fill="#fdf1e4" />
      <circle cx={120} cy={120} r={104} fill={`url(#${ctx.id("bg")})`} />
    </>
  ),
  defs: (_, ctx) => (
    <linearGradient id={ctx.id("bg")} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffe9d2" />
      <stop offset="1" stopColor="#ffc9a8" />
    </linearGradient>
  ),
  paint: (layer) => {
    if (!layer.filled) {
      const stroke = layer.color === WHITE ? WHITE : layer.color ? darken(layer.color, 0.2) : ILLUST_LINE;
      return linePaint(layer, stroke, layer.part === "frame" ? 2.5 : layer.strokeWidth * 0.85);
    }
    const color = layer.color ?? INK;
    return {
      fill: color,
      stroke: layer.strokeWidth > 0 ? (layer.part === "lens" ? ILLUST_LINE : darken(color, 0.45)) : "none",
      strokeWidth: layer.strokeWidth > 0 ? (layer.part === "lens" ? 2.5 : 2) : 0,
      fillOpacity: layer.fillOpacity,
      opacity: layer.opacity,
    };
  },
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

/** 点の目と輪郭線なしのフラットな塗り。背景は服の色に合わせる */
const minimalStyle: VectorStyle = {
  variant: "minimal",
  placeholder: "#3b3540",
  background: (_, layers) => {
    const clothes = layers.find((layer) => layer.part === "clothes")?.color ?? "#f38020";
    // 白っぽい服だと背景が真っ白になるので、そのときはサイトのオレンジ系にする
    const base = luminance(clothes) > 0.8 ? "#f38020" : clothes;
    return <rect width={240} height={240} fill={mix(base, "#ffffff", 0.78)} />;
  },
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

export const VECTOR_STYLES = {
  pop: popStyle(),
  illust: illustStyle,
  chibi: chibiStyle,
  minimal: minimalStyle,
  soft: softStyle,
  lineart: lineartStyle,
  watercolor: watercolorStyle,
  neon: neonStyle,
} satisfies Record<string, VectorStyle>;

export type VectorStyleId = keyof typeof VECTOR_STYLES;
