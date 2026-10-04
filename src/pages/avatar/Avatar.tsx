import { type Ref, type SVGProps, useEffect, useId, useMemo, useRef, useState } from "react";
import type { AvatarStageId } from "../../../shared/avatar";
import { hexToRgb } from "./color";
import { buildLayers, INK, PLACEHOLDER_HEAD, type Shape } from "./geometry";
import type { AvatarParams } from "./params";
import { popStyle, type StyleContext, VECTOR_STYLES, type VectorStyle, type VectorStyleId } from "./styles";

export type AvatarStyleId = VectorStyleId | "pixel";

export const AVATAR_STYLES: { id: AvatarStyleId; label: string }[] = [
  { id: "pop", label: "ポップ" },
  { id: "illust", label: "イラスト" },
  { id: "chibi", label: "ちびキャラ" },
  { id: "minimal", label: "シンプル" },
  { id: "soft", label: "ぷっくり" },
  { id: "lineart", label: "線画" },
  { id: "watercolor", label: "水彩" },
  { id: "neon", label: "ネオン" },
  { id: "pixel", label: "ドット絵" },
];

type Props = {
  params: AvatarParams;
  /** 表示済みの段階。ここに含まれる段階のパーツだけを描く */
  stages: ReadonlySet<AvatarStageId>;
  styleId: AvatarStyleId;
  svgRef?: Ref<SVGSVGElement>;
  /** パーツが現れるときのアニメーション */
  animate?: boolean;
};

export function Avatar({ styleId, ...props }: Props) {
  return styleId === "pixel" ? <PixelAvatar {...props} /> : <VectorAvatar style={VECTOR_STYLES[styleId]} {...props} />;
}

function VectorAvatar({ params, stages, style, svgRef, animate = true }: Omit<Props, "styleId"> & { style: VectorStyle }) {
  const layers = useMemo(() => buildLayers(params, style.variant), [params, style.variant]);
  const prefix = `a${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const ctx: StyleContext = { id: (name) => `${prefix}-${name}` };

  return (
    <svg ref={svgRef} viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" className="size-full">
      <defs>{style.defs?.(layers, ctx)}</defs>
      {style.background(ctx, layers)}

      {!stages.has("face") && (
        <g fill="none" stroke={style.placeholder} strokeOpacity={0.3}>
          <ShapeElement shape={PLACEHOLDER_HEAD} strokeWidth={4} strokeDasharray="10 8" />
          <text x={120} y={128} textAnchor="middle" fontSize={48} fontWeight={900} fill={style.placeholder} fillOpacity={0.3} stroke="none">
            ?
          </text>
        </g>
      )}

      <g filter={style.filter?.(ctx)} strokeLinejoin="round" strokeLinecap="round">
        {layers.map((layer, i) => {
          if (!stages.has(layer.stage)) return null;
          const paint = style.paint(layer, ctx);
          if (!paint) return null;
          const clipId = ctx.id(`clip${i}`);
          return (
            <g key={i} className={animate ? "animate-part-in origin-center [transform-box:fill-box]" : undefined}>
              {layer.clip && (
                <clipPath id={clipId}>
                  <ShapeElement shape={layer.clip} />
                </clipPath>
              )}
              <ShapeElement
                shape={layer.shape}
                transform={layer.transform}
                clipPath={layer.clip ? `url(#${clipId})` : undefined}
                {...paint}
              />
            </g>
          );
        })}
      </g>
      {style.overlay?.(ctx)}
    </svg>
  );
}

function ShapeElement({ shape, ...props }: { shape: Shape } & SVGProps<SVGElement>) {
  const attributes = props as Record<string, unknown>;
  switch (shape.type) {
    case "path":
      return <path d={shape.d} {...attributes} />;
    case "ellipse":
      return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...attributes} />;
    case "circle":
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...attributes} />;
    case "rect":
      return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} {...attributes} />;
  }
}

// ドット絵のマス目の数
const GRID = 48;
// 1 マスを何×何の点から決めるか
const SUPERSAMPLE = 4;
// ドット絵の元にするポップスタイル。縮小しても輪郭線が残るように太くする
const PIXEL_SOURCE = popStyle(1.25);

type Run = { x: number; y: number; width: number; color: string };

/**
 * ポップスタイルの SVG を小さく描いてマス目にする。各マスは、元の絵で使っている色にそろえた
 * SUPERSAMPLE×SUPERSAMPLE 個の点の中で一番多い色にする（境目の中間色が混ざらないようにするため）。
 * ただし輪郭線の色は 3/8 以上あれば優先する。
 * 横に同じ色が続くマスはまとめて 1 つの rect にする
 */
function PixelAvatar({ params, stages, svgRef }: Omit<Props, "styleId">) {
  const sourceRef = useRef<SVGSVGElement>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const stageKey = [...stages].join(",");

  useEffect(() => {
    const svg = sourceRef.current;
    if (!svg) return;
    let cancelled = false;
    pixelate(svg).then(
      (result) => {
        if (!cancelled) setRuns(result);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [params, stageKey]);

  return (
    <>
      <div hidden>
        <VectorAvatar style={PIXEL_SOURCE} params={params} stages={stages} svgRef={sourceRef} animate={false} />
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${GRID} ${GRID}`} xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" className="size-full">
        <rect width={GRID} height={GRID} fill="#fff6ec" />
        {runs.map((run) => (
          <rect key={`${run.x}-${run.y}`} x={run.x} y={run.y} width={run.width} height={1} fill={run.color} />
        ))}
      </svg>
    </>
  );
}

async function pixelate(svg: SVGSVGElement): Promise<Run[]> {
  const source = new XMLSerializer().serializeToString(svg);
  const palette = [...new Set([...(source.match(/#[0-9a-f]{6}\b/gi) ?? []), "#ffffff"].map((c) => c.toLowerCase()))].map((hex) => ({
    hex,
    rgb: hexToRgb(hex),
  }));

  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    const size = GRID * SUPERSAMPLE;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return [];
    context.drawImage(image, 0, 0, size, size);
    const { data } = context.getImageData(0, 0, size, size);

    const nearest = (r: number, g: number, b: number) => {
      let best = palette[0];
      let bestDistance = Infinity;
      for (const color of palette) {
        const distance = (color.rgb[0] - r) ** 2 + (color.rgb[1] - g) ** 2 + (color.rgb[2] - b) ** 2;
        if (distance < bestDistance) {
          best = color;
          bestDistance = distance;
        }
      }
      return best.hex;
    };

    const cellColor = (cx: number, cy: number) => {
      const counts = new Map<string, number>();
      for (let dy = 0; dy < SUPERSAMPLE; dy++) {
        for (let dx = 0; dx < SUPERSAMPLE; dx++) {
          const i = ((cy * SUPERSAMPLE + dy) * size + cx * SUPERSAMPLE + dx) * 4;
          const color = nearest(data[i], data[i + 1], data[i + 2]);
          counts.set(color, (counts.get(color) ?? 0) + 1);
        }
      }
      // 細い輪郭線が周りの色に負けて消えないよう、輪郭線の色は 3/8 以上あれば採用する
      if ((counts.get(INK) ?? 0) * 8 >= SUPERSAMPLE * SUPERSAMPLE * 3) return INK;
      return [...counts.entries()].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    };

    const runs: Run[] = [];
    for (let y = 0; y < GRID; y++) {
      let current: Run | null = null;
      for (let x = 0; x < GRID; x++) {
        const color = cellColor(x, y);
        if (current && current.color === color) {
          current.width++;
        } else {
          current = { x, y, width: 1, color };
          runs.push(current);
        }
      }
    }
    return runs;
  } finally {
    URL.revokeObjectURL(url);
  }
}
