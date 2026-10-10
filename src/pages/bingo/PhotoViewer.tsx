import { useEffect } from "react";
import { type BingoTheme, findItem } from "../../../shared/bingo";
import { defineMessages, useLang, useMessages } from "../../lib/i18n";

export type PhotoEntry = {
  itemId: string;
  photo: string;
  openedAt: number;
};

const MESSAGES = defineMessages({
  ja: {
    foundAt: (time: string) => `${time} に発見`,
    close: "閉じる",
    prev: "前の写真",
    next: "次の写真",
  },
  en: {
    foundAt: (time: string) => `Found at ${time}`,
    close: "Close",
    prev: "Previous photo",
    next: "Next photo",
  },
});

/** 穴を空けた写真を大きく表示する。前後の写真へは、見つけた順に送れる */
export function PhotoViewer({
  entries,
  index,
  theme,
  startedAt,
  formatTime,
  onChange,
  onClose,
}: {
  entries: PhotoEntry[];
  index: number;
  theme: BingoTheme;
  startedAt: number;
  formatTime: (ms: number) => string;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const t = useMessages(MESSAGES);
  const entry = entries[index];
  const item = findItem(theme, entry.itemId);
  const hasSiblings = entries.length > 1;
  const move = (delta: number) => onChange((index + delta + entries.length) % entries.length);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (!hasSiblings) return;
      if (event.key === "ArrowLeft") onChange((index - 1 + entries.length) % entries.length);
      if (event.key === "ArrowRight") onChange((index + 1) % entries.length);
    };
    document.addEventListener("keydown", onKeyDown);
    // 開いているあいだは後ろのページがスクロールしないようにする
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [index, entries.length, hasSiblings, onChange, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item?.label[lang]}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
      onClick={onClose}
    >
      <div className="card-pop w-full max-w-md overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="relative aspect-square bg-ink">
          <img key={entry.openedAt + entry.itemId} src={entry.photo} alt={item?.label[lang]} className="size-full animate-pop-in object-cover" />
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full border-[3px] border-ink bg-white text-lg font-black shadow-[0_3px_0_0_var(--color-ink)]"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-3">
          {hasSiblings && <NavButton label={t.prev} onClick={() => move(-1)}>‹</NavButton>}
          <div className="min-w-0 flex-1 text-center">
            <p className="text-lg leading-tight font-black">
              {item?.emoji} {item?.label[lang]}
            </p>
            <p className="text-xs font-bold text-ink/60">
              {t.foundAt(formatTime(entry.openedAt - startedAt))}
              {hasSiblings && ` · ${index + 1} / ${entries.length}`}
            </p>
          </div>
          {hasSiblings && <NavButton label={t.next} onClick={() => move(1)}>›</NavButton>}
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
