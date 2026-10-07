import { type Ref, type SVGProps, useId, useMemo } from "react";
import type { AvatarStageId } from "../../../shared/avatar";
import type { Localized } from "../../../shared/i18n";
import { buildLayers, PLACEHOLDER_HEAD, type Shape } from "./geometry";
import type { AvatarParams } from "./params";
import { type StyleContext, VECTOR_STYLES, type VectorStyle, type VectorStyleId } from "./styles";

export type AvatarStyleId = VectorStyleId;

export const AVATAR_STYLES: { id: AvatarStyleId; label: Localized }[] = [
  { id: "pop", label: { ja: "ポップ", en: "Pop" } },
  { id: "chibi", label: { ja: "ちびキャラ", en: "Chibi" } },
  { id: "minimal", label: { ja: "シンプル", en: "Simple" } },
  { id: "flat", label: { ja: "フラット", en: "Flat" } },
  { id: "anime", label: { ja: "アニメ", en: "Anime" } },
  { id: "comic", label: { ja: "アメコミ", en: "Comic" } },
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

export function Avatar({ styleId, params, stages, svgRef, animate = true }: Props) {
  const style: VectorStyle = VECTOR_STYLES[styleId];
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

      <g strokeLinejoin="round" strokeLinecap="round">
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
