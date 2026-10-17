import { useEffect } from "react";
import { findTopic, topGuess } from "../../../shared/draw";
import { defineMessages, useLang, useMessages } from "../../lib/i18n";
import { DrawingImage } from "./DrawingImage";
import type { SavedDrawing } from "./history";
import { ShareButton } from "./ShareButton";

const MESSAGES = defineMessages({
  ja: {
    topic: "お題",
    hard: "むずかしい",
    passed: "合格！",
    failed: "ざんねん…",
    guessTopic: (label: string) => `Clef にも「${label}」に見えたみたい`,
    guessOther: (label: string) => `Clef には「${label}」に見えたみたい`,
    guessUnknown: "Clef には何の絵か分からなかったみたい",
    delete: "削除",
    deleteConfirm: "この絵を削除しますか？",
    close: "閉じる",
    prev: "前の絵",
    next: "次の絵",
  },
  en: {
    topic: "Draw",
    hard: "Hard",
    passed: "Passed!",
    failed: "Not quite…",
    guessTopic: (label) => `Clef saw it as "${label}" too`,
    guessOther: (label) => `Clef thought it looked like "${label}"`,
    guessUnknown: "Clef couldn't tell what it was",
    delete: "Delete",
    deleteConfirm: "Delete this drawing?",
    close: "Close",
    prev: "Previous drawing",
    next: "Next drawing",
  },
});

/** これまでに描いた絵を大きく表示する。前後の絵へは、新しい順に送れる */
export function DrawingViewer({
  drawings,
  index,
  onChange,
  onDelete,
  onClose,
}: {
  drawings: SavedDrawing[];
  index: number;
  onChange: (index: number) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const t = useMessages(MESSAGES);
  const drawing = drawings[index];
  const topic = findTopic(drawing.topicId)!;
  const label = topic.label[lang];
  const { judge } = drawing;
  const hasSiblings = drawings.length > 1;
  const move = (delta: number) => onChange((index + delta + drawings.length) % drawings.length);

  const guessId = topGuess(judge.guesses);
  const guessed = findTopic(guessId);
  const guess = guessId === topic.id ? t.guessTopic(label) : guessed ? t.guessOther(guessed.label[lang]) : t.guessUnknown;
  const drawnAt = new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "short" }).format(drawing.drawnAt);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (!hasSiblings) return;
      if (event.key === "ArrowLeft") onChange((index - 1 + drawings.length) % drawings.length);
      if (event.key === "ArrowRight") onChange((index + 1) % drawings.length);
    };
    document.addEventListener("keydown", onKeyDown);
    // 開いているあいだは後ろのページがスクロールしないようにする
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [index, drawings.length, hasSiblings, onChange, onClose]);

  const confirmDelete = () => {
    if (window.confirm(t.deleteConfirm)) onDelete(drawing.id);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50 overflow-y-auto bg-ink/70">
      {/* 小さい画面でも操作できるよう、はみ出したらスクロールできるようにする */}
      <div className="flex min-h-full items-center justify-center p-4" onClick={onClose}>
        <div className="card-pop w-full max-w-md overflow-hidden" onClick={(event) => event.stopPropagation()}>
          <div className="relative">
            <DrawingImage key={drawing.id} strokes={drawing.strokes} label={label} className="animate-pop-in" />
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
              <p
                className={`-rotate-3 rounded-2xl border-[3px] border-ink px-4 py-1 text-lg font-black whitespace-nowrap shadow-[0_4px_0_0_var(--color-ink)] ${
                  judge.passed ? "bg-cf-orange text-white" : "bg-white text-ink"
                }`}
              >
                {judge.passed ? `🎉 ${t.passed}` : `😢 ${t.failed}`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full border-[3px] border-ink bg-white text-lg font-black shadow-[0_3px_0_0_var(--color-ink)]"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3 border-t-[3px] border-ink px-3 pt-3 pb-4">
            <div className="flex items-center gap-2">
              {hasSiblings && <NavButton label={t.prev} onClick={() => move(-1)}>‹</NavButton>}
              <div className="min-w-0 flex-1 text-center">
                {/* お題の名前が切れないよう、「むずかしい」は角に貼って幅をとらないようにする */}
                <p className="relative mx-auto flex w-fit max-w-full items-center gap-1.5 font-black">
                  <span className="shrink-0 text-xs font-extrabold text-ink/60">{t.topic}</span>
                  <span className="truncate text-lg leading-tight">{label}</span>
                  {topic.hard && (
                    <span className="absolute right-0 bottom-full translate-x-3 -rotate-3 rounded-full border-2 border-ink bg-cf-yellow px-2 py-0.5 text-[11px] leading-tight font-black whitespace-nowrap">
                      🔥 {t.hard}
                    </span>
                  )}
                </p>
                <p className="text-xs font-bold text-ink/60">
                  <span className={`font-black tabular-nums ${judge.passed ? "text-cf-orange" : "text-ink"}`}>
                    {Math.round(judge.probability * 100)}%
                  </span>
                  {` · ${drawnAt}`}
                  {hasSiblings && ` · ${index + 1} / ${drawings.length}`}
                </p>
              </div>
              {hasSiblings && <NavButton label={t.next} onClick={() => move(1)}>›</NavButton>}
            </div>
            <p className="text-center text-sm font-bold">💭 {guess}</p>
            <div className="flex flex-col items-center gap-3">
              <ShareButton drawing={drawing} className="btn-pop min-w-60" />
              <button
                type="button"
                onClick={confirmDelete}
                className="text-xs font-extrabold text-ink/50 underline underline-offset-2 hover:text-cf-orange"
              >
                🗑️ {t.delete}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-10 shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-white pb-1 text-2xl font-black shadow-[0_3px_0_0_var(--color-ink)] active:translate-y-[2px] active:shadow-none"
    >
      {children}
    </button>
  );
}
