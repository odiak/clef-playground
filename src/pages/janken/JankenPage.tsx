import { type ReactNode, useEffect, useRef, useState } from "react";
// デモが 2 つ以上になったらデモ一覧へのリンクを復活させる
// import { Link } from "react-router";
import { CLEF_MODELS, type ClefModel } from "../../../shared/clef";
import {
  decideOutcome,
  EXPRESSION_TO_HAND,
  HANDS,
  type Hand,
  type JudgeResponse,
  type Outcome,
} from "../../../shared/janken";
import { judgeExpression } from "./api";
import { captureSquareFrame } from "./capture";
import { EXPRESSION_EMOJI, EXPRESSION_LABEL, HAND_EMOJI, HAND_LABEL, OUTCOME_LABEL } from "./labels";
import { ProbabilityBars } from "./ProbabilityBars";
import { useCamera } from "./useCamera";

type Phase =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "countdown"; count: number }
  | { kind: "judging"; photo: string; computer: Hand }
  | { kind: "result"; photo: string; computer: Hand; judge: JudgeResponse }
  | { kind: "error"; message: string; photo?: string; computer?: Hand };

const MODEL_LABEL: Record<ClefModel, { name: string; note: string }> = {
  "clef-flash": { name: "Clef flash", note: "9B・はやい" },
  clef: { name: "Clef", note: "27B・かしこい" },
};

// カウントダウン 1 拍の長さ
const BEAT_MS = 1000;
// 「1」のあと撮影までの追加の待ち時間。表情を作る反応時間のぶん、少しだけ遅らせる
const CAPTURE_DELAY_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function randomHand(): Hand {
  return HANDS[Math.floor(Math.random() * HANDS.length)];
}

export function JankenPage() {
  const camera = useCamera();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [model, setModel] = useState<ClefModel>("clef-flash");
  const [score, setScore] = useState<Record<Outcome, number>>({ win: 0, draw: 0, lose: 0 });

  // 画面を離れたら進行中のゲームを打ち切る
  const runIdRef = useRef(0);
  useEffect(() => {
    return () => {
      runIdRef.current++;
    };
  }, []);

  const play = async () => {
    const runId = ++runIdRef.current;
    const isCancelled = () => runId !== runIdRef.current;

    setPhase({ kind: "starting" });
    let video: HTMLVideoElement;
    try {
      video = await camera.start();
    } catch (error) {
      if (!isCancelled()) setPhase({ kind: "error", message: (error as Error).message });
      return;
    }

    for (const count of [3, 2, 1]) {
      if (isCancelled()) return;
      setPhase({ kind: "countdown", count });
      await sleep(count === 1 ? BEAT_MS + CAPTURE_DELAY_MS : BEAT_MS);
    }
    if (isCancelled()) return;

    // 0 のタイミングで撮影し、コンピューターの手を出す
    const photo = captureSquareFrame(video);
    const computer = randomHand();
    setPhase({ kind: "judging", photo, computer });

    try {
      const judge = await judgeExpression(photo, model);
      if (isCancelled()) return;
      setPhase({ kind: "result", photo, computer, judge });
      if (judge.hand) {
        const outcome = decideOutcome(judge.hand, computer);
        setScore((prev) => ({ ...prev, [outcome]: prev[outcome] + 1 }));
      }
    } catch (error) {
      if (!isCancelled()) setPhase({ kind: "error", message: (error as Error).message, photo, computer });
    }
  };

  const isBusy = phase.kind === "starting" || phase.kind === "countdown" || phase.kind === "judging";
  const photo = "photo" in phase ? phase.photo : undefined;
  const computer = "computer" in phase ? phase.computer : undefined;
  const judge = phase.kind === "result" ? phase.judge : undefined;
  const outcome = judge?.hand && computer ? decideOutcome(judge.hand, computer) : undefined;

  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* デモが 2 つ以上になったら復活させる
      <Link to="/" className="inline-block text-xs font-extrabold text-ink/60 hover:text-cf-orange">
        ← デモ一覧
      </Link>
      */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black whitespace-nowrap">表情じゃんけん</h1>
          <p className="text-xs font-bold text-ink/70">顔の表情で手を出そう！</p>
        </div>
        <Scoreboard score={score} />
      </div>

      <ul className="grid grid-cols-3 gap-2 text-center">
        {(["smile", "sad", "angry"] as const).map((expression) => {
          const hand = EXPRESSION_TO_HAND[expression]!;
          return (
            <li key={expression} className="rounded-2xl border-2 border-ink bg-white px-1 py-1">
              <div className="text-xl">
                {EXPRESSION_EMOJI[expression]}→{HAND_EMOJI[hand]}
              </div>
              <div className="text-[10px] font-extrabold text-ink/70">
                {EXPRESSION_LABEL[expression]}は{HAND_LABEL[hand]}
              </div>
            </li>
          );
        })}
      </ul>

      {/* ステージ: ゲームの進行はすべてこの中に重ねて表示する */}
      <div className="card-pop relative aspect-square overflow-hidden bg-ink">
        <video
          ref={camera.videoRef}
          muted
          playsInline
          autoPlay
          className={`absolute inset-0 size-full -scale-x-100 object-cover ${camera.isActive && !photo ? "" : "invisible"}`}
        />
        {photo && <img src={photo} alt="撮影した写真" className="absolute inset-0 size-full object-cover" />}

        {!camera.isActive && !photo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cf-peach p-6 text-center">
            <span className="animate-float text-7xl">{phase.kind === "starting" ? "📷" : "🤳"}</span>
            <p className="font-black">
              {phase.kind === "starting" ? "カメラを起動中…" : "インカメラで表情を撮影します"}
            </p>
            <p className="text-xs font-bold text-ink/60">3・2・1・0 の「0」でパシャッ！</p>
          </div>
        )}

        {phase.kind === "countdown" && (
          <CountNumber key={phase.count} className="animate-count">
            {phase.count}
          </CountNumber>
        )}

        {phase.kind === "judging" && (
          <>
            <div className="pointer-events-none absolute inset-0 animate-flash bg-white" />
            <CountNumber className="animate-zero">0</CountNumber>
            <StageBadge>
              <span className="inline-block animate-spin">⏳</span> Clef が判定中…
            </StageBadge>
          </>
        )}

        {judge && (
          <>
            <div className="absolute inset-0 bg-ink/25" />
            <StageBadge>
              {EXPRESSION_EMOJI[judge.expression]} {EXPRESSION_LABEL[judge.expression]}
            </StageBadge>
            <ResultSticker outcome={outcome} />
          </>
        )}

        {(phase.kind === "countdown" || photo) && (
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between">
            <HandBubble
              title="あなた"
              highlight={outcome === "win"}
              sub={judge?.hand ? HAND_LABEL[judge.hand] : undefined}
            >
              {phase.kind === "countdown" ? (
                <span className="opacity-40">❔</span>
              ) : phase.kind === "judging" ? (
                <span className="inline-block animate-float">🤔</span>
              ) : (
                <span key={judge?.hand ?? "unknown"} className="inline-block animate-pop-in">
                  {judge?.hand ? HAND_EMOJI[judge.hand] : "❓"}
                </span>
              )}
            </HandBubble>
            <span className="mb-6 rounded-full border-[3px] border-ink bg-cf-orange px-2.5 py-0.5 text-lg font-black text-white italic">
              VS
            </span>
            <HandBubble
              title="コンピューター"
              highlight={outcome === "lose"}
              sub={computer ? HAND_LABEL[computer] : undefined}
            >
              {computer ? (
                <span key={`${computer}-${photo}`} className="inline-block animate-pop-in">
                  {HAND_EMOJI[computer]}
                </span>
              ) : (
                <ShufflingHand />
              )}
            </HandBubble>
          </div>
        )}
      </div>

      <div className="flex justify-center pt-1">
        <button type="button" className="btn-pop min-w-60" onClick={play} disabled={isBusy}>
          {isBusy ? "じゃんけん…" : phase.kind === "idle" ? "はじめる" : "もう一回！"}
        </button>
      </div>

      {phase.kind === "error" && (
        <Notice>😵 {phase.message}</Notice>
      )}
      {judge && !judge.hand && (
        <Notice>
          {judge.faceProbability < 0.5
            ? "顔がうまく写っていなかったみたい。"
            : "笑顔・悲しい顔・怒った顔のどれにも見えなかったみたい。"}
          もう一度どうぞ！
        </Notice>
      )}

      <details className="group card-pop overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-3 [&::-webkit-details-marker]:hidden">
          <span className="text-sm font-black">🔍 モデルと判定の詳細</span>
          <span className="flex items-center gap-2 text-xs font-bold text-ink/60">
            {MODEL_LABEL[model].name}
            <span className="text-cf-orange transition-transform group-open:rotate-180">▼</span>
          </span>
        </summary>
        <div className="space-y-5 border-t-[3px] border-ink px-5 pt-4 pb-5">
          <ModelToggle value={model} onChange={setModel} disabled={isBusy} />
          {judge ? (
            <ProbabilityBars judge={judge} />
          ) : (
            <p className="text-center text-xs font-bold text-ink/50">じゃんけんすると、ここに Clef の判定結果が表示されます</p>
          )}
        </div>
      </details>

      <p className="text-center text-xs font-bold text-ink/50">
        撮影した写真は判定のためだけに送信され、保存されません。
      </p>
    </div>
  );
}

function Scoreboard({ score }: { score: Record<Outcome, number> }) {
  return (
    <dl className="flex shrink-0 overflow-hidden rounded-2xl border-2 border-ink bg-white text-center text-[10px] font-extrabold">
      {(["win", "draw", "lose"] as const).map((key) => (
        <div key={key} className="border-ink px-2 py-0.5 not-last:border-r-2">
          <dt className="text-ink/60">{{ win: "かち", draw: "あいこ", lose: "まけ" }[key]}</dt>
          <dd className="text-base leading-tight font-black tabular-nums">{score[key]}</dd>
        </div>
      ))}
    </dl>
  );
}

function ModelToggle({
  value,
  onChange,
  disabled,
}: {
  value: ClefModel;
  onChange: (model: ClefModel) => void;
  disabled: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="判定に使うモデル" className="grid grid-cols-2 gap-1 rounded-full border-[3px] border-ink bg-white p-1">
      {CLEF_MODELS.map((model) => {
        const selected = model === value;
        return (
          <button
            key={model}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(model)}
            className={`rounded-full px-3 py-1 transition-colors disabled:cursor-not-allowed ${
              selected ? "bg-cf-orange text-white" : "text-ink/70 hover:bg-cf-cream"
            }`}
          >
            <span className="block text-sm leading-tight font-black">{MODEL_LABEL[model].name}</span>
            <span className={`block text-[10px] font-bold ${selected ? "text-white/85" : "text-ink/50"}`}>
              {MODEL_LABEL[model].note}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CountNumber({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className={`text-[9rem] leading-none font-black text-white [paint-order:stroke_fill] [-webkit-text-stroke:10px_var(--color-ink)] ${className}`}
      >
        {children}
      </span>
    </div>
  );
}

function StageBadge({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 top-3 flex justify-center">
      <span className="animate-pop-in rounded-full border-[3px] border-ink bg-white px-4 py-1 text-sm font-black shadow-[0_4px_0_0_var(--color-ink)]">
        {children}
      </span>
    </div>
  );
}

function HandBubble({
  title,
  sub,
  highlight,
  children,
}: {
  title: string;
  sub?: string;
  highlight: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex w-[34%] flex-col items-center rounded-3xl border-[3px] border-ink px-1 pt-1.5 pb-2 shadow-[0_4px_0_0_var(--color-ink)] transition-colors ${
        highlight ? "bg-cf-yellow" : "bg-white"
      }`}
    >
      <span className="text-[10px] font-extrabold text-ink/70">{title}</span>
      <span className="my-0.5 text-5xl leading-none">{children}</span>
      <span className="h-4 text-xs font-black">{sub}</span>
    </div>
  );
}

function ShufflingHand() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % HANDS.length), 120);
    return () => clearInterval(timer);
  }, []);
  return <span className="inline-block">{HAND_EMOJI[HANDS[index]]}</span>;
}

function ResultSticker({ outcome }: { outcome: Outcome | undefined }) {
  const styles: Record<Outcome, string> = {
    win: "bg-cf-orange text-white",
    draw: "bg-cf-yellow text-ink",
    lose: "bg-ink text-white",
  };
  const emoji: Record<Outcome, string> = { win: "🎉", draw: "🤝", lose: "😭" };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[30%] flex justify-center">
      <div className="-rotate-6">
        <p
          className={`animate-pop-in rounded-3xl border-[3px] border-ink px-6 py-2 text-4xl font-black tracking-wider whitespace-nowrap shadow-[0_6px_0_0_var(--color-ink)] ${
            outcome ? styles[outcome] : "bg-white text-ink"
          }`}
        >
          {outcome ? `${OUTCOME_LABEL[outcome]} ${emoji[outcome]}` : "判定できず 🙈"}
        </p>
      </div>
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-3xl border-[3px] border-ink bg-white px-4 py-3 text-center text-sm font-bold">{children}</p>
  );
}
