import { type ReactNode, useEffect, useRef, useState } from "react";
import type { ClefModel } from "../../../shared/clef";
import {
  decideOutcome,
  EXPRESSION_TO_HAND,
  HAND_EXPRESSIONS,
  HANDS,
  type Hand,
  type JudgeResponse,
  type Outcome,
} from "../../../shared/janken";
import { DetailsCard } from "../../components/DetailsCard";
import { MODEL_LABEL, ModelToggle } from "../../components/ModelToggle";
import { Notice } from "../../components/Notice";
import { TopBar } from "../../components/TopBar";
import { captureSquareFrame } from "../../lib/camera/capture";
import { useCamera } from "../../lib/camera/useCamera";
import { errorMessage } from "../../lib/errors";
import { defineMessages, useLang, useMessages } from "../../lib/i18n";
import { judgeExpression } from "./api";
import { EXPRESSION_EMOJI, EXPRESSION_LABEL, HAND_EMOJI, HAND_LABEL, OUTCOME_LABEL } from "./labels";
import { ProbabilityBars } from "./ProbabilityBars";

type Phase =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "countdown"; count: number }
  | { kind: "judging"; photo: string; computer: Hand }
  | { kind: "result"; photo: string; computer: Hand; judge: JudgeResponse }
  | { kind: "error"; error: unknown; photo?: string; computer?: Hand };

// カウントダウン 1 拍の長さ
const BEAT_MS = 1000;
// 「1」のあと撮影までの追加の待ち時間。表情を作る反応時間のぶん、少しだけ遅らせる
const CAPTURE_DELAY_MS = 400;

const MESSAGES = defineMessages({
  ja: {
    title: "表情じゃんけん",
    lead: "顔の表情で手を出そう！",
    rule: (expression: string, hand: string) => `${expression}は${hand}`,
    photoAlt: "撮影した写真",
    starting: "カメラを起動中…",
    intro: "インカメラで表情を撮影します",
    introNote: "3・2・1・0 の「0」でパシャッ！",
    judging: "Clef が判定中…",
    you: "あなた",
    computer: "コンピューター",
    busy: "じゃんけん…",
    start: "はじめる",
    again: "もう一回！",
    noFace: "顔がうまく写っていなかったみたい。もう一度どうぞ！",
    noExpression: "はっきりした表情に見えなかったみたい。笑顔・驚いた顔・怒った顔のどれかで、もう一度どうぞ！",
    details: "🔍 モデルと判定の詳細",
    detailsEmpty: "じゃんけんすると、ここに Clef の判定結果が表示されます",
    privacy: "撮影した写真は判定のためだけに送信され、保存されません。",
    score: { win: "かち", draw: "あいこ", lose: "まけ" },
    undecided: "判定できず 🙈",
  },
  en: {
    title: "Rock Paper Faces",
    lead: "Throw your hand with your face!",
    rule: (expression, hand) => `${expression} = ${hand}`,
    photoAlt: "Your photo",
    starting: "Starting the camera…",
    intro: "Your front camera will capture your expression",
    introNote: "3, 2, 1, 0 — snap on \"0\"!",
    judging: "Clef is judging…",
    you: "You",
    computer: "Computer",
    busy: "Rock, paper…",
    start: "Start",
    again: "Again!",
    noFace: "Your face wasn't clearly visible. Try again!",
    noExpression: "Couldn't see a clear expression. Try again with a smile, a surprised face, or an angry face!",
    details: "🔍 Model & judgment details",
    detailsEmpty: "Play a round to see Clef's judgment here",
    privacy: "Your photo is sent only for judging and is never stored.",
    score: { win: "Win", draw: "Draw", lose: "Lose" },
    undecided: "Can't tell 🙈",
  },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function randomHand(): Hand {
  return HANDS[Math.floor(Math.random() * HANDS.length)];
}

export function JankenPage() {
  const { lang } = useLang();
  const t = useMessages(MESSAGES);
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

  // バックグラウンドに回るとカメラは解放されるので（useCamera）、撮影前のゲームは打ち切る
  const phaseKindRef = useRef(phase.kind);
  useEffect(() => {
    phaseKindRef.current = phase.kind;
  }, [phase.kind]);
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;
      if (phaseKindRef.current === "starting" || phaseKindRef.current === "countdown") {
        runIdRef.current++;
        setPhase({ kind: "idle" });
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const play = async () => {
    const runId = ++runIdRef.current;
    const isCancelled = () => runId !== runIdRef.current;

    setPhase({ kind: "starting" });
    let video: HTMLVideoElement;
    try {
      video = await camera.start();
    } catch (error) {
      if (!isCancelled()) setPhase({ kind: "error", error });
      return;
    }

    for (const count of [3, 2, 1]) {
      if (isCancelled()) return;
      setPhase({ kind: "countdown", count });
      await sleep(count === 1 ? BEAT_MS + CAPTURE_DELAY_MS : BEAT_MS);
    }
    if (isCancelled()) return;

    // 0 のタイミングで撮影し、コンピューターの手を出す
    let photo: string;
    try {
      photo = captureSquareFrame(video);
    } catch (error) {
      camera.stop();
      setPhase({ kind: "error", error });
      return;
    }
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
      if (!isCancelled()) setPhase({ kind: "error", error, photo, computer });
    }
  };

  const isBusy = phase.kind === "starting" || phase.kind === "countdown" || phase.kind === "judging";
  const photo = "photo" in phase ? phase.photo : undefined;
  const computer = "computer" in phase ? phase.computer : undefined;
  const judge = phase.kind === "result" ? phase.judge : undefined;
  const outcome = judge?.hand && computer ? decideOutcome(judge.hand, computer) : undefined;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <title>{`${t.title} | Clef Playground`}</title>
      <TopBar back />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black whitespace-nowrap">{t.title}</h1>
          <p className="text-xs font-bold text-ink/70">{t.lead}</p>
        </div>
        <Scoreboard score={score} labels={t.score} />
      </div>

      <ul className="grid grid-cols-3 gap-2 text-center">
        {HAND_EXPRESSIONS.map((expression) => {
          const hand = EXPRESSION_TO_HAND[expression]!;
          return (
            <li key={expression} className="rounded-2xl border-2 border-ink bg-white px-1 py-1">
              <div className="text-xl">
                {EXPRESSION_EMOJI[expression]}→{HAND_EMOJI[hand]}
              </div>
              <div className="text-[10px] font-extrabold text-ink/70">
                {t.rule(EXPRESSION_LABEL[expression][lang], HAND_LABEL[hand][lang])}
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
        {photo && <img src={photo} alt={t.photoAlt} className="absolute inset-0 size-full object-cover" />}

        {!camera.isActive && !photo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cf-peach p-6 text-center">
            <span className="animate-float text-7xl">{phase.kind === "starting" ? "📷" : "🤳"}</span>
            <p className="font-black">
              {phase.kind === "starting" ? t.starting : t.intro}
            </p>
            <p className="text-xs font-bold text-ink/60">{t.introNote}</p>
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
              <span className="inline-block animate-spin">⏳</span> {t.judging}
            </StageBadge>
          </>
        )}

        {judge && (
          <>
            {/* 顔（特に目と口）を隠さないよう、上下だけ暗くしてステッカーは上端に置く */}
            <div className="absolute inset-0 bg-linear-to-b from-ink/35 via-transparent via-40% to-ink/25" />
            <ResultSticker outcome={outcome} undecided={t.undecided} />
          </>
        )}

        {(phase.kind === "countdown" || photo) && (
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between">
            <HandBubble
              title={t.you}
              highlight={outcome === "win"}
              sub={
                judge?.hand
                  ? `${EXPRESSION_EMOJI[judge.expression]} ${EXPRESSION_LABEL[judge.expression][lang]}`
                  : undefined
              }
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
              title={t.computer}
              highlight={outcome === "lose"}
              sub={computer ? HAND_LABEL[computer][lang] : undefined}
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
          {isBusy ? t.busy : phase.kind === "idle" ? t.start : t.again}
        </button>
      </div>

      {phase.kind === "error" && (
        <Notice>😵 {errorMessage(phase.error, lang)}</Notice>
      )}
      {judge && !judge.hand && (
        <Notice>{judge.faceProbability < 0.5 ? t.noFace : t.noExpression}</Notice>
      )}

      <DetailsCard title={t.details} aside={MODEL_LABEL[model].name}>
        <ModelToggle value={model} onChange={setModel} disabled={isBusy} />
        {judge ? (
          <ProbabilityBars judge={judge} />
        ) : (
          <p className="text-center text-xs font-bold text-ink/50">{t.detailsEmpty}</p>
        )}
      </DetailsCard>

      <p className="text-center text-xs font-bold text-ink/50">{t.privacy}</p>
    </div>
  );
}

function Scoreboard({ score, labels }: { score: Record<Outcome, number>; labels: Record<Outcome, string> }) {
  return (
    <dl className="flex shrink-0 overflow-hidden rounded-2xl border-2 border-ink bg-white text-center text-[10px] font-extrabold">
      {(["win", "draw", "lose"] as const).map((key) => (
        <div key={key} className="border-ink px-2 py-0.5 not-last:border-r-2">
          <dt className="text-ink/60">{labels[key]}</dt>
          <dd className="text-base leading-tight font-black tabular-nums">{score[key]}</dd>
        </div>
      ))}
    </dl>
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

function ResultSticker({ outcome, undecided }: { outcome: Outcome | undefined; undecided: string }) {
  const { lang } = useLang();
  const styles: Record<Outcome, string> = {
    win: "bg-cf-orange text-white",
    draw: "bg-cf-yellow text-ink",
    lose: "bg-ink text-white",
  };
  const emoji: Record<Outcome, string> = { win: "🎉", draw: "🤝", lose: "😭" };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
      <div className="-rotate-6">
        <p
          className={`animate-pop-in rounded-3xl border-[3px] border-ink px-5 py-1.5 text-3xl font-black tracking-wider whitespace-nowrap shadow-[0_5px_0_0_var(--color-ink)] ${
            outcome ? styles[outcome] : "bg-white text-ink"
          }`}
        >
          {outcome ? `${OUTCOME_LABEL[outcome][lang]} ${emoji[outcome]}` : undecided}
        </p>
      </div>
    </div>
  );
}
