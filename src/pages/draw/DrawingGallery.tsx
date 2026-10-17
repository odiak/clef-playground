import { useCallback, useState } from "react";
import { findTopic } from "../../../shared/draw";
import { defineMessages, useLang, useMessages } from "../../lib/i18n";
import { DrawingImage } from "./DrawingImage";
import { DrawingViewer } from "./DrawingViewer";
import { MAX_SAVED_DRAWINGS, type SavedDrawing } from "./history";

// たたんでいるときに並べる枚数（4 列で 2 段）
const PREVIEW_COUNT = 8;

const MESSAGES = defineMessages({
  ja: {
    title: "これまでの絵",
    count: (count: number) => `${count} 枚`,
    showAll: (count: number) => `すべて見る（${count} 枚）`,
    showLess: "たたむ",
    note: (max: number) => `タップすると大きく表示して、シェアできます。新しいものから ${max} 枚まで保存されます`,
  },
  en: {
    title: "Your drawings",
    count: (count) => `${count}`,
    showAll: (count) => `Show all (${count})`,
    showLess: "Show less",
    note: (max) => `Tap one to view and share it. Your latest ${max} drawings are kept`,
  },
});

/** これまでに描いた絵の一覧。タップすると大きく表示し、そこからシェアや削除ができる */
export function DrawingGallery({ drawings, onDelete }: { drawings: SavedDrawing[]; onDelete: (id: string) => void }) {
  const { lang } = useLang();
  const t = useMessages(MESSAGES);
  const [showAll, setShowAll] = useState(false);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const close = useCallback(() => setViewingIndex(null), []);

  if (drawings.length === 0) return null;
  const shown = showAll ? drawings : drawings.slice(0, PREVIEW_COUNT);

  // 消したら同じ位置の絵（最後の絵を消したらその前の絵）を表示する
  const remove = (id: string) => {
    onDelete(id);
    const remaining = drawings.length - 1;
    setViewingIndex((index) => (index === null || remaining === 0 ? null : Math.min(index, remaining - 1)));
  };

  return (
    <>
      <section className="card-pop space-y-3 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-black">🖼️ {t.title}</h2>
          <p className="text-xs font-bold text-ink/60">{t.count(drawings.length)}</p>
        </div>
        <ul className="grid grid-cols-4 gap-2">
          {shown.map((drawing, index) => {
            const label = findTopic(drawing.topicId)!.label[lang];
            return (
              <li key={drawing.id}>
                <button type="button" onClick={() => setViewingIndex(index)} className="group block w-full cursor-zoom-in">
                  <span className="relative block overflow-hidden rounded-xl border-2 border-ink transition-transform group-hover:-rotate-2 group-active:scale-95">
                    <DrawingImage strokes={drawing.strokes} label={label} />
                    <span
                      className={`absolute right-1 bottom-1 rounded-full border-2 border-ink px-1 text-[10px] leading-tight font-black tabular-nums ${
                        drawing.judge.passed ? "bg-cf-orange text-white" : "bg-white text-ink"
                      }`}
                    >
                      {Math.round(drawing.judge.probability * 100)}%
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-center text-[10px] font-extrabold">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {drawings.length > PREVIEW_COUNT && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-extrabold text-ink/50 underline underline-offset-2 hover:text-cf-orange"
            >
              {showAll ? t.showLess : t.showAll(drawings.length)}
            </button>
          </div>
        )}
        <p className="text-center text-[10px] font-bold text-ink/50">{t.note(MAX_SAVED_DRAWINGS)}</p>
      </section>

      {viewingIndex !== null && drawings[viewingIndex] && (
        <DrawingViewer drawings={drawings} index={viewingIndex} onChange={setViewingIndex} onDelete={remove} onClose={close} />
      )}
    </>
  );
}
