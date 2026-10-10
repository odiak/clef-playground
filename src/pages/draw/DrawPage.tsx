import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import type { ClefModel } from "../../../shared/clef";
import { DRAW_TOPICS, type DrawJudgeResponse, type DrawTopic, findTopic, TIME_LIMITS, type TimeLimit } from "../../../shared/draw";
import { DetailsCard } from "../../components/DetailsCard";
import { MODEL_LABEL, ModelToggle } from "../../components/ModelToggle";
import { Notice } from "../../components/Notice";
import { TopBar } from "../../components/TopBar";
import { errorMessage } from "../../lib/errors";
import { defineMessages, useLang, useMessages } from "../../lib/i18n";
import { judgeDrawing } from "./api";
import { DrawingCanvas, type DrawingCanvasHandle } from "./DrawingCanvas";
import { exportDrawing, hasInk, type Tool, useDrawingHistory } from "./drawing";

type Phase =
  | { kind: "setup" }
  | { kind: "countdown"; topic: DrawTopic; count: number }
  | { kind: "drawing"; topic: DrawTopic; deadline: number | null }
  | { kind: "judging"; topic: DrawTopic; image: string }
  /** judge が null のときは、何も描かれていなかった */
  | { kind: "result"; topic: DrawTopic; image: string | null; judge: DrawJudgeResponse | null }
  | { kind: "error"; topic: DrawTopic; image: string; error: unknown };

// 判定に送る画像の大きさ
const IMAGE_SIZE = 512;
const COUNT_MS = 700;
// 残りがこれ以下になったら、タイマーを赤くして急かす
const HURRY_MS = 5000;
// 同じお題が続けて出ないよう、最近出たお題は避ける
const RECENT_TOPICS = 20;
const TIME_LIMIT_KEY = "clef-draw-time-limit";

const MESSAGES = defineMessages({
  ja: {
    title: "描けるかな？",
    lead: "お題を指やマウスで描いて、Clef に当ててもらおう",
    howTo: [
      "ランダムにお題が出ます",
      "指やマウスで、黒い線だけで描こう",
      "Clef がお題の絵に見えると判定したら合格！",
    ],
    timeLimitLabel: "時間制限",
    timeLimits: { 30: { name: "30 秒", note: "時間切れで判定" }, none: { name: "なし", note: "じっくり描く" } },
    start: "はじめる",
    topic: "お題",
    pen: "ペン",
    eraser: "消しゴム",
    undo: "元に戻す",
    redo: "やり直す",
    clear: "全部消す",
    done: "✅ 完了",
    canvasLabel: "お絵かきキャンバス",
    drawingAlt: "描いた絵",
    timeUp: "そこまで！",
    judging: "Clef が判定中…",
    passed: "合格！",
    failed: "ざんねん…",
    empty: "何も描かれていませんでした",
    score: "お題の絵に見える確率",
    passLine: (percent: number) => `合格ライン ${percent}%`,
    guessTopic: (label: string) => `Clef にも「${label}」に見えたみたい`,
    guessOther: (label: string) => `Clef には「${label}」に見えたみたい`,
    guessUnknown: "Clef には何の絵か分からなかったみたい",
    retry: "もう一度判定する",
    next: "▶ 次のお題",
    again: "同じお題でもう一回",
    changeTimeLimit: "⏱️ 時間制限を変える",
    details: "🔍 モデルと判定の詳細",
    detailsEmpty: "描いて判定すると、ここに Clef の判定結果が表示されます",
    judgment: "Clef の判定",
    match: "お題の絵に見える",
    guesses: "何の絵に見えるか（お題とランダムなお題から）",
    other: "どれでもない",
    privacy: "描いた絵は判定のためだけに送信され、サーバーには保存されません。",
  },
  en: {
    title: "Can You Draw It?",
    lead: "Draw the prompt with your finger or mouse, and see if Clef gets it",
    howTo: [
      "You get a random prompt",
      "Draw it with your finger or mouse, in black lines only",
      "If Clef sees it as the prompt, you pass!",
    ],
    timeLimitLabel: "Time limit",
    timeLimits: { 30: { name: "30 sec", note: "Judged when time's up" }, none: { name: "None", note: "Take your time" } },
    start: "Start",
    topic: "Draw",
    pen: "Pen",
    eraser: "Eraser",
    undo: "Undo",
    redo: "Redo",
    clear: "Clear",
    done: "✅ Done",
    canvasLabel: "Drawing canvas",
    drawingAlt: "Your drawing",
    timeUp: "Time's up!",
    judging: "Clef is judging…",
    passed: "Passed!",
    failed: "Not quite…",
    empty: "Nothing was drawn",
    score: "Looks like the prompt",
    passLine: (percent) => `Pass line ${percent}%`,
    guessTopic: (label) => `Clef saw it as "${label}" too`,
    guessOther: (label) => `Clef thought it looked like "${label}"`,
    guessUnknown: "Clef couldn't tell what it was",
    retry: "Judge again",
    next: "▶ Next prompt",
    again: "Try the same prompt",
    changeTimeLimit: "⏱️ Change time limit",
    details: "🔍 Model & judgment details",
    detailsEmpty: "Draw something to see Clef's judgment here",
    judgment: "Clef's judgment",
    match: "Looks like the prompt",
    guesses: "What it looks like (prompt and random others)",
    other: "None of these",
    privacy: "Your drawing is sent only for judging and is never stored on the server.",
  },
});

type Messages = (typeof MESSAGES)["ja"];

function loadTimeLimit(): TimeLimit {
  try {
    return localStorage.getItem(TIME_LIMIT_KEY) === "none" ? null : 30;
  } catch {
    return 30;
  }
}

function saveTimeLimit(timeLimit: TimeLimit) {
  try {
    localStorage.setItem(TIME_LIMIT_KEY, timeLimit === null ? "none" : String(timeLimit));
  } catch {
    // 保存できなくても遊べる
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 描いているあいだだけ、残り時間の表示のために今の時刻を細かく更新する */
function useNow(running: boolean): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [running]);
  return now;
}

export function DrawPage() {
  const { lang } = useLang();
  const t = useMessages(MESSAGES);
  const [phase, setPhase] = useState<Phase>({ kind: "setup" });
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(loadTimeLimit);
  const [model, setModel] = useState<ClefModel>("clef");
  const [tool, setTool] = useState<Tool>("pen");
  const drawing = useDrawingHistory();
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const recentRef = useRef<string[]>([]);
  // 判定の途中で次のお題に進んだり、画面を離れたりしたら、その判定結果は捨てる
  const runIdRef = useRef(0);
  useEffect(() => {
    return () => {
      runIdRef.current++;
    };
  }, []);

  const isDrawing = phase.kind === "drawing";
  const now = useNow(isDrawing && phase.deadline !== null);
  const judge = phase.kind === "result" ? phase.judge : null;

  const pickTopic = (): DrawTopic => {
    const candidates = DRAW_TOPICS.filter((topic) => !recentRef.current.includes(topic.id));
    const topic = candidates[Math.floor(Math.random() * candidates.length)];
    recentRef.current = [topic.id, ...recentRef.current].slice(0, RECENT_TOPICS);
    return topic;
  };

  const play = async (topic: DrawTopic, limit: TimeLimit) => {
    const runId = ++runIdRef.current;
    drawing.reset();
    setTool("pen");
    // 時間制限があるときは、お題を読む時間をとってから始める
    if (limit !== null) {
      for (const count of [3, 2, 1]) {
        setPhase({ kind: "countdown", topic, count });
        await sleep(COUNT_MS);
        if (runId !== runIdRef.current) return;
      }
    }
    setPhase({ kind: "drawing", topic, deadline: limit === null ? null : Date.now() + limit * 1000 });
  };

  const start = (limit: TimeLimit) => {
    setTimeLimit(limit);
    saveTimeLimit(limit);
    void play(pickTopic(), limit);
  };

  const judgeImage = async (topic: DrawTopic, image: string) => {
    const runId = ++runIdRef.current;
    setPhase({ kind: "judging", topic, image });
    try {
      const result = await judgeDrawing(image, model, topic.id);
      if (runId === runIdRef.current) setPhase({ kind: "result", topic, image, judge: result });
    } catch (error) {
      if (runId === runIdRef.current) setPhase({ kind: "error", topic, image, error });
    }
  };

  // 時間切れのときにタイマーから呼ぶので、いつも最新の状態を見る
  const finishRef = useRef<() => void>(() => {});
  finishRef.current = () => {
    if (phase.kind !== "drawing") return;
    canvasRef.current?.flush();
    const strokes = drawing.latestRef.current;
    if (!hasInk(strokes)) {
      setPhase({ kind: "result", topic: phase.topic, image: null, judge: null });
      return;
    }
    void judgeImage(phase.topic, exportDrawing(strokes, IMAGE_SIZE));
  };
  const finish = useCallback(() => finishRef.current(), []);

  const deadline = phase.kind === "drawing" ? phase.deadline : null;
  useEffect(() => {
    if (deadline === null) return;
    const timer = setTimeout(finish, Math.max(0, deadline - Date.now()));
    return () => clearTimeout(timer);
  }, [deadline, finish]);

  // パソコンでは Ctrl/⌘ + Z で元に戻す、Shift もいっしょに押すとやり直す
  const { undo, redo } = drawing;
  useEffect(() => {
    if (!isDrawing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) undo();
      else if ((key === "z" && event.shiftKey) || key === "y") redo();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawing, undo, redo]);

  const backToSetup = () => {
    runIdRef.current++;
    setPhase({ kind: "setup" });
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <title>{`${t.title} | Clef Playground`}</title>
      <TopBar back />
      <div>
        <h1 className="text-2xl font-black">{t.title}</h1>
        <p className="text-xs font-bold text-ink/70">{t.lead}</p>
      </div>

      {phase.kind === "setup" ? (
        <Setup timeLimit={timeLimit} onStart={start} t={t} />
      ) : (
        <>
          <TopicBar
            topic={phase.topic}
            remainingMs={phase.kind === "drawing" && phase.deadline !== null ? phase.deadline - now : null}
            timeLimit={timeLimit}
            showTimer={timeLimit !== null && (phase.kind === "countdown" || phase.kind === "drawing")}
            t={t}
          />

          <div className="card-pop relative overflow-hidden">
            {phase.kind === "countdown" || phase.kind === "drawing" ? (
              <DrawingCanvas
                ref={canvasRef}
                strokes={drawing.strokes}
                tool={tool}
                disabled={phase.kind !== "drawing"}
                onStroke={drawing.addStroke}
                label={t.canvasLabel}
              />
            ) : phase.kind !== "result" || phase.image ? (
              <img src={phase.image!} alt={t.drawingAlt} className="block aspect-square w-full" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-white p-6 text-center font-black text-ink/50">
                {t.empty}
              </div>
            )}

            {phase.kind === "countdown" && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-cf-peach/90">
                <p className="text-sm font-extrabold text-ink/60">{t.topic}</p>
                <p className="text-3xl font-black">
                  {phase.topic.emoji} {phase.topic.label[lang]}
                </p>
                <CountNumber key={phase.count}>{phase.count}</CountNumber>
              </div>
            )}
            {phase.kind === "judging" && (
              <StageSticker className="bg-white text-ink">
                <span className="inline-block animate-spin">⏳</span> {t.judging}
              </StageSticker>
            )}
            {phase.kind === "result" &&
              (judge?.passed ? (
                <StageSticker className="bg-cf-orange text-white">🎉 {t.passed}</StageSticker>
              ) : (
                <StageSticker className="bg-white text-ink">😢 {t.failed}</StageSticker>
              ))}
          </div>

          {phase.kind === "drawing" || phase.kind === "countdown" ? (
            <>
              <Toolbar
                tool={tool}
                onTool={setTool}
                canUndo={drawing.canUndo}
                canRedo={drawing.canRedo}
                canClear={drawing.strokes.length > 0}
                onUndo={drawing.undo}
                onRedo={drawing.redo}
                onClear={drawing.clear}
                disabled={phase.kind !== "drawing"}
                t={t}
              />
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  className="btn-pop min-w-60"
                  onClick={finish}
                  disabled={phase.kind !== "drawing" || !hasInk(drawing.strokes)}
                >
                  {t.done}
                </button>
              </div>
            </>
          ) : phase.kind === "judging" ? (
            <div className="flex justify-center pt-1">
              <button type="button" className="btn-pop min-w-60" disabled>
                {t.judging}
              </button>
            </div>
          ) : (
            <>
              {phase.kind === "error" && (
                <>
                  <Notice>😵 {errorMessage(phase.error, lang)}</Notice>
                  <div className="flex justify-center">
                    <button type="button" className="btn-sub min-w-60" onClick={() => judgeImage(phase.topic, phase.image)}>
                      {t.retry}
                    </button>
                  </div>
                </>
              )}
              {phase.kind === "result" && <ResultCard topic={phase.topic} judge={phase.judge} t={t} />}
              <div className="flex flex-col items-center gap-3 pt-1">
                <button type="button" className="btn-pop min-w-60" onClick={() => play(pickTopic(), timeLimit)}>
                  {t.next}
                </button>
                <button type="button" className="btn-sub min-w-60" onClick={() => play(phase.topic, timeLimit)}>
                  {t.again}
                </button>
                <button
                  type="button"
                  onClick={backToSetup}
                  className="text-xs font-extrabold text-ink/50 underline underline-offset-2 hover:text-cf-orange"
                >
                  {t.changeTimeLimit}
                </button>
              </div>
            </>
          )}
        </>
      )}

      <DetailsCard title={t.details} aside={MODEL_LABEL[model].name}>
        <ModelToggle value={model} onChange={setModel} disabled={phase.kind === "judging"} />
        {judge && phase.kind === "result" ? (
          <JudgeDetails judge={judge} topic={phase.topic} t={t} />
        ) : (
          <p className="text-center text-xs font-bold text-ink/50">{t.detailsEmpty}</p>
        )}
      </DetailsCard>

      <p className="text-center text-xs font-bold text-ink/50">{t.privacy}</p>
    </div>
  );
}

function Setup({ timeLimit, onStart, t }: { timeLimit: TimeLimit; onStart: (limit: TimeLimit) => void; t: Messages }) {
  const [selected, setSelected] = useState(timeLimit);
  return (
    <div className="card-pop space-y-5 p-5">
      <ol className="space-y-2">
        {t.howTo.map((step, index) => (
          <li key={step} className="flex items-start gap-2 text-sm font-bold">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cf-orange text-xs font-black text-white">
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <div className="space-y-2">
        <p className="text-center text-xs font-extrabold text-ink/60">{t.timeLimitLabel}</p>
        <div role="radiogroup" aria-label={t.timeLimitLabel} className="grid grid-cols-2 gap-1 rounded-full border-[3px] border-ink bg-white p-1">
          {TIME_LIMITS.map((value) => {
            const isSelected = value === selected;
            const label = t.timeLimits[value ?? "none"];
            return (
              <button
                key={value ?? "none"}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(value)}
                className={`rounded-full px-3 py-1 transition-colors ${isSelected ? "bg-cf-orange text-white" : "text-ink/70 hover:bg-cf-cream"}`}
              >
                <span className="block text-lg leading-tight font-black">{label.name}</span>
                <span className={`block text-[10px] font-bold ${isSelected ? "text-white/85" : "text-ink/50"}`}>{label.note}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <button type="button" className="btn-pop min-w-60" onClick={() => onStart(selected)}>
          {t.start}
        </button>
      </div>
    </div>
  );
}

function TopicBar({
  topic,
  remainingMs,
  timeLimit,
  showTimer,
  t,
}: {
  topic: DrawTopic;
  remainingMs: number | null;
  timeLimit: TimeLimit;
  showTimer: boolean;
  t: Messages;
}) {
  const { lang } = useLang();
  const totalMs = (timeLimit ?? 0) * 1000;
  const remaining = remainingMs === null ? totalMs : Math.max(0, remainingMs);
  const hurry = remainingMs !== null && remaining <= HURRY_MS;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 font-black">
          <span className="shrink-0 text-xs font-extrabold text-ink/60">{t.topic}</span>
          <span className="text-xl">{topic.emoji}</span>
          <span className="truncate">{topic.label[lang]}</span>
        </p>
        {showTimer && (
          <p
            className={`shrink-0 rounded-2xl border-2 border-ink px-3 py-0.5 text-xl font-black tabular-nums ${
              hurry ? "animate-pulse bg-red-500 text-white" : "bg-white"
            }`}
          >
            {remainingMs !== null && remaining === 0 ? t.timeUp : `${Math.ceil(remaining / 1000)}s`}
          </p>
        )}
      </div>
      {showTimer && (
        <div className="h-2.5 overflow-hidden rounded-full border-2 border-ink bg-white">
          <div
            className={`h-full ${hurry ? "bg-red-500" : "bg-cf-orange"}`}
            style={{ width: `${totalMs > 0 ? (remaining / totalMs) * 100 : 0}%` }}
          />
        </div>
      )}
    </div>
  );
}

function Toolbar({
  tool,
  onTool,
  canUndo,
  canRedo,
  canClear,
  onUndo,
  onRedo,
  onClear,
  disabled,
  t,
}: {
  tool: Tool;
  onTool: (tool: Tool) => void;
  canUndo: boolean;
  canRedo: boolean;
  canClear: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  disabled: boolean;
  t: Messages;
}) {
  const tools: { value: Tool; icon: string; label: string }[] = [
    { value: "pen", icon: "✏️", label: t.pen },
    { value: "eraser", icon: "🧽", label: t.eraser },
  ];
  const actions = [
    { icon: "↩️", label: t.undo, onClick: onUndo, enabled: canUndo },
    { icon: "↪️", label: t.redo, onClick: onRedo, enabled: canRedo },
    { icon: "🗑️", label: t.clear, onClick: onClear, enabled: canClear },
  ];
  return (
    <div className="flex items-stretch justify-between gap-2">
      <div role="radiogroup" className="flex gap-1 rounded-2xl border-[3px] border-ink bg-white p-1">
        {tools.map(({ value, icon, label }) => {
          const isSelected = value === tool;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onTool(value)}
              className={`flex min-w-14 flex-col items-center rounded-xl px-2 py-0.5 transition-colors disabled:opacity-50 ${
                isSelected ? "bg-cf-orange text-white" : "text-ink/70 hover:bg-cf-cream"
              }`}
            >
              <span className="text-lg leading-tight">{icon}</span>
              <span className="text-[10px] font-extrabold">{label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-1 rounded-2xl border-[3px] border-ink bg-white p-1">
        {actions.map(({ icon, label, onClick, enabled }) => (
          <button
            key={label}
            type="button"
            disabled={disabled || !enabled}
            onClick={onClick}
            className="flex min-w-12 flex-col items-center rounded-xl px-1.5 py-0.5 text-ink/70 transition-colors hover:bg-cf-cream disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <span className="text-lg leading-tight">{icon}</span>
            <span className="text-[10px] font-extrabold">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CountNumber({ children }: { children: ReactNode }) {
  return (
    <span className="animate-count text-[7rem] leading-none font-black text-white [paint-order:stroke_fill] [-webkit-text-stroke:10px_var(--color-ink)]">
      {children}
    </span>
  );
}

function StageSticker({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
      <p
        className={`animate-pop-in -rotate-3 rounded-2xl border-[3px] border-ink px-4 py-1 text-lg font-black whitespace-nowrap shadow-[0_4px_0_0_var(--color-ink)] ${className}`}
      >
        {children}
      </p>
    </div>
  );
}

function ResultCard({ topic, judge, t }: { topic: DrawTopic; judge: DrawJudgeResponse | null; t: Messages }) {
  const { lang } = useLang();
  const percent = Math.round((judge?.probability ?? 0) * 100);
  const passLine = Math.round((judge?.threshold ?? 0.5) * 100);

  // 何の絵に見えたかの、一番確率が高い選択肢
  const guess = (() => {
    if (!judge) return null;
    const [id] = Object.entries(judge.guesses).reduce((best, entry) => (entry[1] > best[1] ? entry : best), ["", -1]);
    if (id === topic.id) return t.guessTopic(topic.label[lang]);
    const guessed = findTopic(id);
    return guessed ? t.guessOther(`${guessed.emoji} ${guessed.label[lang]}`) : t.guessUnknown;
  })();

  return (
    <div className="card-pop space-y-3 p-5 text-center">
      <p className="text-xs font-extrabold text-ink/60">{t.score}</p>
      <p className={`text-6xl leading-none font-black tabular-nums ${judge?.passed ? "text-cf-orange" : "text-ink"}`}>
        {percent}
        <span className="text-3xl">%</span>
      </p>
      <div className="relative pt-5">
        <div className="relative h-5 overflow-hidden rounded-full border-2 border-ink bg-cf-cream">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out ${
              judge?.passed ? "bg-cf-orange" : "bg-cf-yellow/70"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        {/* 合格ラインの目印 */}
        <div className="absolute top-0 bottom-0 flex flex-col items-center" style={{ left: `${passLine}%`, translate: "-50% 0" }}>
          <span className="text-[10px] leading-4 font-extrabold whitespace-nowrap text-ink/70">{t.passLine(passLine)}</span>
          <span className="w-0.5 flex-1 bg-ink" />
        </div>
      </div>
      {guess && <p className="text-sm font-bold">💭 {guess}</p>}
    </div>
  );
}

function JudgeDetails({ judge, topic, t }: { judge: DrawJudgeResponse; topic: DrawTopic; t: Messages }) {
  const { lang } = useLang();
  const topGuess = Object.entries(judge.guesses).reduce((best, entry) => (entry[1] > best[1] ? entry : best), ["", -1])[0];
  const rows = Object.entries(judge.guesses)
    .map(([id, probability]) => {
      const guessed = findTopic(id);
      return { id, label: guessed ? `${guessed.emoji} ${guessed.label[lang]}` : `❓ ${t.other}`, probability };
    })
    .sort((a, b) => b.probability - a.probability);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-black">{t.judgment}</h3>
        <p className="text-xs font-bold text-ink/60">
          {judge.model} · {judge.latencyMs}ms
        </p>
      </div>
      <ul className="space-y-2">
        <ProbabilityRow
          label={`${topic.emoji} ${t.match}`}
          probability={judge.probability}
          isChosen={judge.passed}
        />
      </ul>
      <div className="space-y-2">
        <p className="text-xs font-extrabold text-ink/60">{t.guesses}</p>
        <ul className="space-y-2">
          {rows.map(({ id, label, probability }) => (
            <ProbabilityRow
              key={id}
              label={id === topic.id ? `${label} ★` : label}
              probability={probability}
              isChosen={id === topGuess}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function ProbabilityRow({ label, probability, isChosen }: { label: string; probability: number; isChosen: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span className="w-32 shrink-0 truncate text-xs font-extrabold">{label}</span>
      <span className="relative h-5 flex-1 overflow-hidden rounded-full border-2 border-ink bg-cf-cream">
        <span
          className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out ${
            isChosen ? "bg-cf-orange" : "bg-cf-yellow/60"
          }`}
          style={{ width: `${probability * 100}%` }}
        />
      </span>
      <span className="w-10 shrink-0 text-right text-xs font-black tabular-nums">{Math.round(probability * 100)}%</span>
    </li>
  );
}
