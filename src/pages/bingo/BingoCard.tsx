import { useMemo } from "react";
import { findItem, findTheme } from "../../../shared/bingo";
import { useLang } from "../../lib/i18n";
import { type BingoCell, type BingoGame, completedLines, isOpen } from "./game";

export function BingoCard({ game }: { game: BingoGame }) {
  const theme = findTheme(game.themeId)!;
  const winning = useMemo(() => new Set(completedLines(game).flat()), [game]);
  const isLarge = game.size === 3;

  return (
    <ul
      className="grid gap-1.5 rounded-[28px] border-[3px] border-ink bg-cf-orange p-2 shadow-[6px_6px_0_0_var(--color-ink)] sm:gap-2 sm:p-3"
      style={{ gridTemplateColumns: `repeat(${game.size}, minmax(0, 1fr))` }}
    >
      {game.cells.map((cell, index) => (
        <li key={cell.itemId ?? "free"}>
          <Cell cell={cell} label={cell.itemId ? findItem(theme, cell.itemId) : undefined} isLarge={isLarge} isWinning={winning.has(index)} />
        </li>
      ))}
    </ul>
  );
}

function Cell({
  cell,
  label,
  isLarge,
  isWinning,
}: {
  cell: BingoCell;
  label: ReturnType<typeof findItem>;
  isLarge: boolean;
  isWinning: boolean;
}) {
  const { lang } = useLang();
  const base = `relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-ink text-center ${
    isWinning ? "outline-[3px] outline-offset-1 outline-cf-yellow" : ""
  }`;

  if (!label) {
    return (
      <div className={`${base} bg-cf-yellow`}>
        <span className={isLarge ? "text-4xl" : "text-xl"}>⭐</span>
        <span className={`font-black ${isLarge ? "text-base" : "text-[10px]"}`}>FREE</span>
      </div>
    );
  }

  const name = (
    <span className={`leading-tight font-extrabold break-words ${isLarge ? "text-sm" : "text-[9px] sm:text-[11px]"}`}>
      {label.label[lang]}
    </span>
  );

  if (!isOpen(cell)) {
    return (
      <div className={`${base} gap-0.5 bg-white px-0.5`}>
        <span className={isLarge ? "text-4xl" : "text-xl sm:text-2xl"}>{label.emoji}</span>
        {name}
      </div>
    );
  }

  // 穴が空いたマス: 撮った写真をパンチで抜いた穴からのぞかせる
  return (
    <div key={cell.openedAt} className={`${base} animate-pop-in bg-cf-peach`}>
      {cell.photo ? (
        <img src={cell.photo} alt={label.label[lang]} className="absolute inset-0 size-full object-cover" />
      ) : (
        <span className={`absolute ${isLarge ? "text-4xl" : "text-xl"}`}>{label.emoji}</span>
      )}
      <span className="absolute inset-[8%] rounded-full border-[3px] border-cf-orange shadow-[0_0_0_200px_rgb(43_43_51/0.35)] sm:border-4" />
      <span
        className={`absolute inset-x-0.5 bottom-0.5 rounded-md bg-white/90 px-0.5 ${isLarge ? "py-0.5" : ""}`}
      >
        {name}
      </span>
    </div>
  );
}
