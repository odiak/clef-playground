import type { ReactNode, Ref } from "react";
import type { AvatarStageId, OptionId } from "../../../shared/avatar";
import type { AvatarParams } from "./params";

const INK = "#2b2b33";

const SKIN: Record<OptionId<"skin_tone">, string> = {
  light: "#fde0c8",
  medium: "#f2c09a",
  tan: "#d29a6c",
  deep: "#8f5b3e",
};

const HAIR: Record<OptionId<"hair_color">, string> = {
  black: "#2a2730",
  dark_brown: "#4b3022",
  brown: "#8b5a34",
  blonde: "#ecc66c",
  gray: "#c4c4ca",
  red: "#c0512f",
  colorful: "#e264a8",
};

const CLOTHES: Record<OptionId<"clothing_color">, string> = {
  black: "#34343c",
  white: "#ffffff",
  gray: "#9b9ba3",
  navy: "#2f3e6b",
  blue: "#5b9be0",
  green: "#4caf6e",
  red: "#e0483e",
  orange: "#f38020",
  yellow: "#f7c948",
  pink: "#f39ac0",
  purple: "#8e63c9",
  brown: "#b08a64",
};

const IRIS: Record<OptionId<"eye_color">, string> = {
  dark_brown: "#3b2a22",
  light_brown: "#8a5a2b",
  blue: "#3f7fd6",
  green: "#3c9a5f",
  gray: "#7c8591",
};

const HEAD: Record<OptionId<"face_shape">, { halfWidth: number; shape: ReactNode }> = {
  round: { halfWidth: 54, shape: <ellipse cx={120} cy={112} rx={54} ry={58} /> },
  oval: {
    halfWidth: 50,
    shape: <path d="M120 52 C152 52 170 78 170 108 C170 144 146 172 120 172 C94 172 70 144 70 108 C70 78 88 52 120 52 Z" />,
  },
  square: {
    halfWidth: 52,
    shape: <path d="M68 82 C68 62 86 54 120 54 C154 54 172 62 172 82 L172 128 C172 156 150 168 120 168 C90 168 68 156 68 128 Z" />,
  },
  long: { halfWidth: 46, shape: <ellipse cx={120} cy={112} rx={46} ry={64} /> },
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

type Props = {
  params: AvatarParams;
  /** 表示済みの段階。ここに含まれる段階のパーツだけを描く */
  stages: ReadonlySet<AvatarStageId>;
  svgRef?: Ref<SVGSVGElement>;
};

export function Avatar({ params: p, stages, svgRef }: Props) {
  const skin = SKIN[p.skinTone];
  const hair = HAIR[p.hairColor];
  // 眉やひげの色。髪がない人や、髪を派手な色に染めている人はこげ茶にする
  const bodyHair = p.hairLength === "bald" || p.hairColor === "colorful" ? HAIR.dark_brown : hair;
  const head = HEAD[p.faceShape];
  const hasLongHair = p.hairLength === "medium" || p.hairLength === "long";
  const bun = p.hairTied && hasLongHair && p.hat === "none";
  const hairBack = hasLongHair && !p.hairTied ? (p.hairLength as "medium" | "long") : null;

  const show = (stage: AvatarStageId, children: ReactNode) =>
    stages.has(stage) ? <Part>{children}</Part> : null;

  return (
    <svg ref={svgRef} viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" className="size-full">
      <rect width={240} height={240} fill="#fff6ec" />
      <circle cx={120} cy={120} r={104} fill="#ffe3c8" />

      {!stages.has("face") && (
        <g>
          <ellipse cx={120} cy={112} rx={52} ry={58} fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth={4} strokeDasharray="10 8" />
          <text x={120} y={128} textAnchor="middle" fontSize={48} fontWeight={900} fill={INK} fillOpacity={0.25}>
            ?
          </text>
        </g>
      )}

      <g stroke={INK} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
        {show(
          "hair",
          <>
            {bun && <circle cx={120} cy={30} r={17} fill={hair} />}
            {hairBack && <path d={HAIR_BACK[hairBack]} fill={hair} />}
            {hairBack && p.hairTexture === "curly" && <CurlyBumps side={hairBack} color={hair} />}
          </>,
        )}

        {show("face", <rect x={104} y={146} width={32} height={42} fill={skin} />)}

        {show(
          "clothes",
          <>
            <path d="M30 240 C34 204 64 186 104 182 L136 182 C176 186 206 204 210 240 Z" fill={CLOTHES[p.clothingColor]} />
            <path d="M104 182 Q120 200 136 182 Z" fill={skin} />
          </>,
        )}

        {show(
          "face",
          <>
            <circle cx={120 - head.halfWidth - 1} cy={116} r={11} fill={skin} />
            <circle cx={120 + head.halfWidth + 1} cy={116} r={11} fill={skin} />
          </>,
        )}

        {show(
          "extras",
          p.earrings && (
            <>
              <circle cx={120 - head.halfWidth - 3} cy={131} r={4} fill="#f7c948" strokeWidth={2} />
              <circle cx={120 + head.halfWidth + 3} cy={131} r={4} fill="#f7c948" strokeWidth={2} />
            </>
          ),
        )}

        {show("hair", hairBack && FRONT_LOCKS[hairBack].map((d) => <path key={d} d={d} fill={hair} />))}

        {show("face", <g fill={skin}>{head.shape}</g>)}

        {show(
          "cheeks",
          <g stroke="none">
            <ellipse cx={86} cy={130} rx={10} ry={6} fill="#ff7f8a" opacity={p.rosyCheeks ? 0.55 : 0.18} />
            <ellipse cx={154} cy={130} rx={10} ry={6} fill="#ff7f8a" opacity={p.rosyCheeks ? 0.55 : 0.18} />
            {p.freckles &&
              [
                [82, 124],
                [89, 127],
                [84, 131],
                [151, 127],
                [158, 124],
                [156, 131],
              ].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.7} fill="#8a5a3b" opacity={0.75} />)}
          </g>,
        )}

        {show("hair", <HairCap params={p} color={hair} />)}

        {show("brows", <Brows params={p} color={bodyHair} />)}

        {show(
          "eyes",
          <>
            <Eye params={p} cx={LEFT_EYE} side="left" />
            <Eye params={p} cx={RIGHT_EYE} side="right" />
          </>,
        )}

        {show("mouth", <path d={NOSE[p.noseSize]} fill="none" strokeWidth={3} />)}

        {show("extras", <FacialHair kind={p.facialHair} color={bodyHair} />)}

        {show("mouth", <Mouth params={p} />)}

        {show("extras", <Glasses kind={p.glasses} halfWidth={head.halfWidth} />)}

        {show("extras", <Hat kind={p.hat} />)}
      </g>
    </svg>
  );
}

function Part({ children }: { children: ReactNode }) {
  return <g className="animate-part-in origin-center [transform-box:fill-box]">{children}</g>;
}

function HairCap({ params: p, color }: { params: AvatarParams; color: string }) {
  if (p.hairLength === "bald") {
    return <path d="M96 66 Q108 58 122 60" fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={4} />;
  }
  if (p.hairLength === "buzz") {
    return <path d={BUZZ} fill={color} fillOpacity={0.9} />;
  }
  return (
    <>
      {p.hairTexture === "curly" && <CurlyBumps side="top" color={color} />}
      <path d={HAIR_CAP_TOP + HAIR_CAP_EDGE[p.bangs]} fill={color} />
      {p.hairTexture === "wavy" && (
        <g fill="none" strokeWidth={2.5} strokeOpacity={0.35}>
          <path d="M84 52 q8 6 16 0 t16 0" />
          <path d="M122 46 q8 6 16 0 t16 0" />
        </g>
      )}
    </>
  );
}

/** くせ毛のもこもこ。円を並べて、上に重ねる髪で内側を隠す */
function CurlyBumps({ side, color }: { side: "top" | "medium" | "long"; color: string }) {
  const points =
    side === "top"
      ? [200, 222, 245, 270, 295, 318, 340].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return [120 + 58 * Math.cos(rad), 104 + 66 * Math.sin(rad)];
        })
      : [100, 130, 160, ...(side === "long" ? [190] : [])].flatMap((y) => [
          [62, y],
          [178, y],
        ]);
  return (
    <>
      {points.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={13} fill={color} />
      ))}
    </>
  );
}

function Brows({ params: p, color }: { params: AvatarParams; color: string }) {
  const paths =
    p.browShape === "arched"
      ? ["M86 98 Q98 88 110 95", "M130 95 Q142 88 154 98"]
      : ["M87 96 L109 94", "M131 94 L153 96"];
  return (
    <g fill="none" stroke={color} strokeWidth={BROW_WIDTH[p.browThickness]}>
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

function Eye({ params: p, cx, side }: { params: AvatarParams; cx: number; side: "left" | "right" }) {
  const rx = EYE_SIZE[p.eyeSize];
  const ry = p.monolid ? rx * 0.8 : rx * 1.1;
  // たれ目は目尻（外側）を下げる。左目は反時計回り、右目は時計回りに回す
  const angle = EYE_SLANT[p.eyeSlant] * (side === "left" ? -1 : 1);
  const outer = side === "left" ? -1 : 1;
  return (
    <g transform={`rotate(${angle} ${cx} ${EYE_Y})`}>
      <ellipse cx={cx} cy={EYE_Y} rx={rx} ry={ry} fill={IRIS[p.eyeColor]} strokeWidth={2.5} />
      <ellipse cx={cx} cy={EYE_Y} rx={rx * 0.5} ry={ry * 0.5} fill={INK} stroke="none" />
      <circle cx={cx + rx * 0.3} cy={EYE_Y - ry * 0.35} r={rx * 0.32} fill="#fff" stroke="none" />
      {p.monolid ? (
        <path d={`M${cx - rx - 2} ${EYE_Y - ry * 0.4} Q${cx} ${EYE_Y - ry - 3} ${cx + rx + 2} ${EYE_Y - ry * 0.4}`} fill="none" strokeWidth={3} />
      ) : (
        <path d={`M${cx - rx - 1} ${EYE_Y - ry - 3} Q${cx} ${EYE_Y - ry - 9} ${cx + rx + 1} ${EYE_Y - ry - 3}`} fill="none" strokeWidth={2} />
      )}
      {p.longLashes && (
        <g fill="none" strokeWidth={2}>
          <path d={`M${cx + outer * rx * 0.9} ${EYE_Y - ry * 0.6} l${outer * 5} -4`} />
          <path d={`M${cx + outer * rx * 0.5} ${EYE_Y - ry * 0.95} l${outer * 3} -5`} />
        </g>
      )}
    </g>
  );
}

function Mouth({ params: p }: { params: AvatarParams }) {
  if (p.mouthOpen && p.smiling) {
    return (
      <>
        <path d="M106 140 Q120 162 134 140 Z" fill="#8b2c35" strokeWidth={3} />
        <path d="M108 141 L132 141 L130 145 Q120 147 110 145 Z" fill="#fff" stroke="none" />
      </>
    );
  }
  if (p.mouthOpen) {
    return <ellipse cx={120} cy={146} rx={6} ry={8} fill="#8b2c35" strokeWidth={3} />;
  }
  return (
    <>
      {p.lipThickness === "full" && <path d="M108 143 Q120 137 132 143 Q120 155 108 143 Z" fill="#e07a86" strokeWidth={2.5} />}
      <path
        d={p.smiling ? "M106 140 Q120 154 134 140" : "M110 144 Q120 147 130 144"}
        fill="none"
        strokeWidth={p.lipThickness === "thin" ? 3 : 3.5}
      />
    </>
  );
}

function FacialHair({ kind, color }: { kind: OptionId<"facial_hair">; color: string }) {
  const mustache = (
    <path
      d="M104 137 C110 131 116 133 120 136 C124 133 130 131 136 137 C130 141 124 140 120 138 C116 140 110 141 104 137 Z"
      fill={color}
      strokeWidth={2}
    />
  );
  const jaw = "M76 122 C78 160 100 174 120 174 C140 174 162 160 164 122 C156 150 140 158 120 158 C100 158 84 150 76 122 Z";
  switch (kind) {
    case "none":
      return null;
    case "stubble":
      return <path d={jaw} fill={color} fillOpacity={0.28} stroke="none" />;
    case "mustache":
      return mustache;
    case "beard":
      return (
        <>
          <path d={jaw} fill={color} strokeWidth={3} />
          {mustache}
        </>
      );
  }
}

function Glasses({ kind, halfWidth }: { kind: OptionId<"glasses">; halfWidth: number }) {
  if (kind === "none") return null;
  const lens = (cx: number) =>
    kind === "round" ? (
      <circle cx={cx} cy={EYE_Y} r={14} />
    ) : (
      <rect x={cx - 15} y={EYE_Y - 11} width={30} height={22} rx={kind === "sunglasses" ? 8 : 4} />
    );
  return (
    <g strokeWidth={3.5} fill={kind === "sunglasses" ? INK : "#fff"} fillOpacity={kind === "sunglasses" ? 0.92 : 0.2}>
      {lens(LEFT_EYE)}
      {lens(RIGHT_EYE)}
      <path d="M112 110 Q120 105 128 110" fill="none" />
      <path d={`M${LEFT_EYE - 15} 109 L${120 - halfWidth} 106`} fill="none" />
      <path d={`M${RIGHT_EYE + 15} 109 L${120 + halfWidth} 106`} fill="none" />
      {kind === "sunglasses" && (
        <g stroke="#fff" strokeOpacity={0.6} strokeWidth={2} fill="none">
          <path d={`M${LEFT_EYE - 8} 106 l6 -3`} />
          <path d={`M${RIGHT_EYE - 8} 106 l6 -3`} />
        </g>
      )}
    </g>
  );
}

function Hat({ kind }: { kind: OptionId<"hat"> }) {
  switch (kind) {
    case "none":
      return null;
    case "cap":
      return (
        <>
          <path d="M62 94 C60 50 90 30 120 30 C150 30 180 50 178 94 Z" fill="#f38020" />
          <path d="M62 94 Q120 82 178 94 Q182 108 120 102 Q58 108 62 94 Z" fill="#c95f0a" />
          <circle cx={120} cy={31} r={4} fill="#c95f0a" strokeWidth={2.5} />
        </>
      );
    case "beanie":
      return (
        <>
          <circle cx={120} cy={26} r={11} fill="#faae40" />
          <path d="M62 96 C60 52 90 32 120 32 C150 32 180 52 178 96 Z" fill="#faae40" />
          <rect x={58} y={88} width={124} height={18} rx={9} fill="#f38020" />
        </>
      );
  }
}
