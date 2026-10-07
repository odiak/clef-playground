import { useEffect, useMemo, useRef, useState } from "react";
import {
  AVATAR_QUESTIONS,
  AVATAR_STAGES,
  type AnalyzeResponse,
  type AvatarAnswers,
  type AvatarQuestionId,
  type AvatarStageId,
} from "../../../shared/avatar";
import type { ClefModel } from "../../../shared/clef";
import type { Lang, Localized } from "../../../shared/i18n";
import { DetailsCard } from "../../components/DetailsCard";
import { MODEL_LABEL, ModelToggle } from "../../components/ModelToggle";
import { Notice } from "../../components/Notice";
import { TopBar } from "../../components/TopBar";
import { captureSquareFrame } from "../../lib/camera/capture";
import { useCamera } from "../../lib/camera/useCamera";
import { errorMessage } from "../../lib/errors";
import { defineMessages, useLang, useMessages } from "../../lib/i18n";
import { analyzeFace } from "./api";
import { Avatar, AVATAR_STYLES, type AvatarStyleId } from "./Avatar";
import { toAvatarParams } from "./params";
import { saveSvgAsPng } from "./saveImage";
import { StylePicker } from "./StylePicker";

type Phase =
  | { kind: "camera" }
  | { kind: "confirm"; photo: string }
  | {
      kind: "building";
      photo: string;
      result: AnalyzeResponse | null;
      /** 回答を表示し終えた質問の数 */
      answered: number;
      /** パーツを描き終えた段階の数 */
      stagesDone: number;
    }
  | { kind: "done"; photo: string; result: AnalyzeResponse }
  | { kind: "error"; error: unknown; photo?: string };

// 回答は一瞬で返ってくるので、1 問ずつ答えを見せながら段階的に組み立てる
const QUESTION_MS = 320;
const STAGE_MS = 450;

const QUESTION_COUNT = AVATAR_STAGES.reduce((sum, stage) => sum + stage.questions.length, 0);

const MESSAGES = defineMessages({
  ja: {
    title: "アバターメーカー",
    lead: (count: number) => `Clef が顔について ${count} の質問に答えて、あなたのアバターを作ります`,
    photoAlt: "撮影した写真",
    asking: "Clef に質問中…",
    done: "完成！🎉",
    intro: "顔を正面から撮影します",
    introNote: "明るい場所で、顔が枠いっぱいに入るように撮ってね",
    takePhoto: "📸 撮影する",
    startCamera: "カメラを起動",
    retake: "撮り直す",
    ok: "OK！",
    again: "もう一回",
    save: "保存する",
    resend: "送り直す",
    saveFailed: "画像の保存に失敗しました",
    details: "🔍 モデルと回答の詳細",
    detailsEmpty: "アバターを作ると、ここに Clef の回答が表示されます",
    privacy: "撮影した写真は判定のためだけに送信され、保存されません。",
    skip: "スキップ",
    yes: "はい",
    no: "いいえ",
  },
  en: {
    title: "Avatar Maker",
    lead: (count) => `Clef answers ${count} questions about your face to make your avatar`,
    photoAlt: "Your photo",
    asking: "Asking Clef…",
    done: "Done! 🎉",
    intro: "Take a photo of your face from the front",
    introNote: "Find a bright spot and fill the frame with your face",
    takePhoto: "📸 Take photo",
    startCamera: "Start camera",
    retake: "Retake",
    ok: "OK!",
    again: "Again",
    save: "Save",
    resend: "Try again",
    saveFailed: "Couldn't save the image",
    details: "🔍 Model & answer details",
    detailsEmpty: "Make an avatar to see Clef's answers here",
    privacy: "Your photo is sent only for judging and is never stored.",
    skip: "Skip",
    yes: "Yes",
    no: "No",
  },
});

type Messages = (typeof MESSAGES)["ja"];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STYLE_STORAGE_KEY = "clef-avatar-style";

function loadStyle(): AvatarStyleId {
  try {
    const saved = localStorage.getItem(STYLE_STORAGE_KEY);
    if (AVATAR_STYLES.some((style) => style.id === saved)) return saved as AvatarStyleId;
  } catch {
    // ストレージが使えなくても既定のスタイルで動かす
  }
  return "pop";
}

export function AvatarPage() {
  const { lang } = useLang();
  const t = useMessages(MESSAGES);
  const camera = useCamera();
  const [phase, setPhase] = useState<Phase>({ kind: "camera" });
  const [model, setModel] = useState<ClefModel>("clef");
  const [styleId, setStyleId] = useState<AvatarStyleId>(loadStyle);
  const changeStyle = (style: AvatarStyleId) => {
    setStyleId(style);
    try {
      localStorage.setItem(STYLE_STORAGE_KEY, style);
    } catch {
      // 保存できなくても選択は反映する
    }
  };
  const svgRef = useRef<SVGSVGElement>(null);

  const runIdRef = useRef(0);
  useEffect(() => {
    return () => {
      runIdRef.current++;
    };
  }, []);

  const startCamera = async () => {
    setPhase({ kind: "camera" });
    try {
      await camera.start();
    } catch (error) {
      setPhase({ kind: "error", error });
    }
  };

  const takePhoto = () => {
    const video = camera.videoRef.current;
    if (!video) return;
    try {
      setPhase({ kind: "confirm", photo: captureSquareFrame(video, 768) });
    } catch (error) {
      camera.stop();
      setPhase({ kind: "error", error });
    }
  };

  const build = async (photo: string) => {
    const runId = ++runIdRef.current;
    const isCancelled = () => runId !== runIdRef.current;
    // 確認中はカメラを使わないので、組み立てに入ったら解放する
    camera.stop();

    setPhase({ kind: "building", photo, result: null, answered: 0, stagesDone: 0 });
    let result: AnalyzeResponse;
    try {
      result = await analyzeFace(photo, model);
    } catch (error) {
      if (!isCancelled()) setPhase({ kind: "error", error, photo });
      return;
    }

    let answered = 0;
    for (const [index, stage] of AVATAR_STAGES.entries()) {
      for (let i = 0; i < stage.questions.length; i++) {
        if (isCancelled()) return;
        answered++;
        setPhase({ kind: "building", photo, result, answered, stagesDone: index });
        await sleep(QUESTION_MS);
      }
      if (isCancelled()) return;
      setPhase({ kind: "building", photo, result, answered, stagesDone: index + 1 });
      await sleep(STAGE_MS);
    }
    if (isCancelled()) return;
    setPhase({ kind: "done", photo, result });
  };

  const skip = () => {
    if (phase.kind !== "building" || !phase.result) return;
    runIdRef.current++;
    setPhase({ kind: "done", photo: phase.photo, result: phase.result });
  };

  const save = async () => {
    if (!svgRef.current) return;
    try {
      await saveSvgAsPng(svgRef.current, `clef-avatar-${styleId}.png`);
    } catch {
      window.alert(t.saveFailed);
    }
  };

  const result = phase.kind === "building" || phase.kind === "done" ? phase.result : null;
  const params = useMemo(() => (result ? toAvatarParams(result.answers) : null), [result]);
  const stagesDone = phase.kind === "done" ? AVATAR_STAGES.length : phase.kind === "building" ? phase.stagesDone : 0;
  const stages = useMemo(
    () => new Set<AvatarStageId>(AVATAR_STAGES.slice(0, stagesDone).map((stage) => stage.id)),
    [stagesDone],
  );
  const photo = "photo" in phase ? phase.photo : undefined;
  const showAvatar = phase.kind === "building" || phase.kind === "done";

  return (
    <div className="mx-auto max-w-md space-y-4">
      <title>{`${t.title} | Clef Playground`}</title>
      <TopBar back />
      <div>
        <h1 className="text-2xl font-black">{t.title}</h1>
        <p className="text-xs font-bold text-ink/70">{t.lead(QUESTION_COUNT)}</p>
      </div>

      {/* ステージ: カメラ → 撮った写真 → アバター */}
      <div className="card-pop relative aspect-square overflow-hidden bg-ink">
        <video
          ref={camera.videoRef}
          muted
          playsInline
          autoPlay
          className={`absolute inset-0 size-full -scale-x-100 object-cover ${phase.kind === "camera" && camera.isActive ? "" : "invisible"}`}
        />

        {(phase.kind === "confirm" || (phase.kind === "error" && photo)) && (
          <img src={photo} alt={t.photoAlt} className="absolute inset-0 size-full object-cover" />
        )}

        {showAvatar && (
          <div className="absolute inset-0">
            {params ? (
              <Avatar params={params} stages={stages} styleId={styleId} svgRef={svgRef} />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-3 bg-cf-cream">
                <span className="animate-float text-7xl">🤔</span>
                <p className="font-black">{t.asking}</p>
              </div>
            )}
            {photo && (
              <img
                src={photo}
                alt={t.photoAlt}
                className="absolute top-3 left-3 size-16 rounded-2xl border-[3px] border-ink object-cover shadow-[0_3px_0_0_var(--color-ink)]"
              />
            )}
            {phase.kind === "done" && (
              <div className="pointer-events-none absolute top-3 right-3 -rotate-6">
                <p className="animate-pop-in rounded-2xl border-[3px] border-ink bg-cf-orange px-3 py-1 text-xl font-black text-white shadow-[0_4px_0_0_var(--color-ink)]">
                  {t.done}
                </p>
              </div>
            )}
          </div>
        )}

        {(phase.kind === "camera" || (phase.kind === "error" && !photo)) && !camera.isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cf-peach p-6 text-center">
            <span className="animate-float text-7xl">🧑‍🎨</span>
            <p className="font-black">{t.intro}</p>
            <p className="text-xs font-bold text-ink/60">{t.introNote}</p>
          </div>
        )}
      </div>

      {phase.kind === "camera" && (
        <div className="flex justify-center pt-1">
          {camera.isActive ? (
            <button type="button" className="btn-pop min-w-60" onClick={takePhoto}>
              {t.takePhoto}
            </button>
          ) : (
            <button type="button" className="btn-pop min-w-60" onClick={startCamera}>
              {t.startCamera}
            </button>
          )}
        </div>
      )}

      {phase.kind === "confirm" && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button type="button" className="btn-sub" onClick={startCamera}>
            {t.retake}
          </button>
          <button type="button" className="btn-pop" onClick={() => build(phase.photo)}>
            {t.ok}
          </button>
        </div>
      )}

      {phase.kind === "building" && <BuildProgress phase={phase} onSkip={skip} t={t} />}

      {phase.kind === "done" && params && <StylePicker params={params} value={styleId} onChange={changeStyle} />}

      {phase.kind === "done" && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button type="button" className="btn-sub" onClick={startCamera}>
            {t.again}
          </button>
          <button type="button" className="btn-pop" onClick={save}>
            {t.save}
          </button>
        </div>
      )}

      {phase.kind === "error" && (
        <>
          <Notice>😵 {errorMessage(phase.error, lang)}</Notice>
          <div className={`grid gap-3 ${phase.photo ? "grid-cols-2" : ""}`}>
            <button type="button" className={phase.photo ? "btn-sub" : "btn-pop"} onClick={startCamera}>
              {t.retake}
            </button>
            {phase.photo && (
              <button type="button" className="btn-pop" onClick={() => build(phase.photo!)}>
                {t.resend}
              </button>
            )}
          </div>
        </>
      )}

      <DetailsCard title={t.details} aside={MODEL_LABEL[model].name}>
        <ModelToggle value={model} onChange={setModel} disabled={phase.kind === "building"} />
        {result ? (
          <AnswerTable result={result} t={t} />
        ) : (
          <p className="text-center text-xs font-bold text-ink/50">{t.detailsEmpty}</p>
        )}
      </DetailsCard>

      <p className="text-center text-xs font-bold text-ink/50">{t.privacy}</p>
    </div>
  );
}

function BuildProgress({
  phase,
  onSkip,
  t,
}: {
  phase: Extract<Phase, { kind: "building" }>;
  onSkip: () => void;
  t: Messages;
}) {
  const { lang } = useLang();
  // いま回答を表示している段階。パーツを描き終えたら次の段階に進む
  const stageIndex = Math.min(phase.stagesDone, AVATAR_STAGES.length - 1);
  const stage = AVATAR_STAGES[stageIndex];
  const offset = AVATAR_STAGES.slice(0, stageIndex).reduce((sum, s) => sum + s.questions.length, 0);

  return (
    <div className="card-pop space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-black">
          <span className="mr-2 rounded-full bg-cf-orange px-2 py-0.5 text-xs text-white">
            STEP {stageIndex + 1}/{AVATAR_STAGES.length}
          </span>
          {stage.label[lang]}
        </p>
        <button
          type="button"
          onClick={onSkip}
          disabled={!phase.result}
          className="text-xs font-extrabold text-ink/50 underline underline-offset-2 disabled:invisible"
        >
          {t.skip}
        </button>
      </div>

      <div className="flex gap-1">
        {AVATAR_STAGES.map((s, index) => (
          <span
            key={s.id}
            className={`h-2 flex-1 rounded-full border-2 border-ink transition-colors ${
              index < phase.stagesDone ? "bg-cf-orange" : index === stageIndex ? "bg-cf-yellow" : "bg-white"
            }`}
          />
        ))}
      </div>

      <ul className="space-y-1.5">
        {stage.questions.map((id, i) => {
          const isAnswered = phase.result !== null && offset + i < phase.answered;
          return (
            <li key={id} className="flex items-center justify-between gap-2 rounded-2xl bg-cf-cream px-3 py-1.5 text-sm">
              <span className="font-extrabold">Q. {AVATAR_QUESTIONS[id].label[lang]}</span>
              {isAnswered && phase.result ? (
                <AnswerPill id={id} answers={phase.result.answers} t={t} />
              ) : (
                <span className="font-black text-ink/30">…</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatAnswer(id: AvatarQuestionId, answers: AvatarAnswers, t: Messages, lang: Lang): { text: string; percent: number } {
  const question = AVATAR_QUESTIONS[id];
  const answer = answers[id];
  if (answer.type === "noul") {
    const yes = answer.noul >= 0.5;
    return { text: yes ? t.yes : t.no, percent: Math.round((yes ? answer.noul : 1 - answer.noul) * 100) };
  }
  const options = "options" in question ? (question.options as Record<string, { label: Localized }>) : {};
  const probabilities = answer.probabilities as Record<string, number>;
  return { text: options[answer.choice]?.label[lang] ?? answer.choice, percent: Math.round(probabilities[answer.choice] * 100) };
}

function AnswerPill({ id, answers, t }: { id: AvatarQuestionId; answers: AvatarAnswers; t: Messages }) {
  const { lang } = useLang();
  const { text, percent } = formatAnswer(id, answers, t, lang);
  return (
    <span className="animate-pop-in shrink-0 rounded-full border-2 border-ink bg-white px-2.5 py-0.5 text-xs font-black">
      {text} <span className="text-cf-orange">{percent}%</span>
    </span>
  );
}

function AnswerTable({ result, t }: { result: AnalyzeResponse; t: Messages }) {
  const { lang } = useLang();
  return (
    <div className="space-y-3">
      <p className="text-right text-xs font-bold text-ink/60">
        {result.model} · {result.latencyMs}ms
      </p>
      {AVATAR_STAGES.map((stage) => (
        <div key={stage.id}>
          <h3 className="mb-1 text-xs font-black text-cf-orange-dark">{stage.label[lang]}</h3>
          <ul className="space-y-1">
            {stage.questions.map((id) => {
              const { text, percent } = formatAnswer(id, result.answers, t, lang);
              return (
                <li key={id} className="flex justify-between gap-2 text-xs font-bold">
                  <span className="text-ink/70">{AVATAR_QUESTIONS[id].label[lang]}</span>
                  <span className="font-black">
                    {text} <span className="text-cf-orange">{percent}%</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
