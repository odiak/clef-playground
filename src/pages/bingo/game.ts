import { BINGO_SIZES, type BingoSize, type BingoTheme, findItem, findTheme } from "../../../shared/bingo";

export type BingoCell = {
  /** null は 5x5 の中央の FREE */
  itemId: string | null;
  /** 穴が空いた時刻 */
  openedAt?: number;
  /** 穴を空けた写真の縮小版（data URL） */
  photo?: string;
};

export type BingoGame = {
  /** 判定中にカードを配り直したときに、古い判定結果を捨てるための ID */
  id: string;
  themeId: string;
  size: BingoSize;
  cells: BingoCell[];
  startedAt: number;
  /** 判定した写真の枚数 */
  shots: number;
  finishedAt?: number;
  result?: "bingo" | "gaveUp";
};

export function shuffle<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** テーマのお題からランダムに選んでカードを配る */
export function createGame(size: BingoSize, theme: BingoTheme): BingoGame {
  const hasFree = size === 5;
  const count = size * size - (hasFree ? 1 : 0);
  const itemIds: (string | null)[] = shuffle(theme.items.map((item) => item.id)).slice(0, count);
  if (hasFree) itemIds.splice(Math.floor((size * size) / 2), 0, null);

  return {
    id: crypto.randomUUID(),
    themeId: theme.id,
    size,
    cells: itemIds.map((itemId) => ({ itemId })),
    startedAt: Date.now(),
    shots: 0,
  };
}

export function isOpen(cell: BingoCell): boolean {
  return cell.itemId === null || cell.openedAt !== undefined;
}

/** 縦・横・斜めのラインを、マスの番号の配列で返す */
function allLines(size: number): number[][] {
  const range = Array.from({ length: size }, (_, i) => i);
  return [
    ...range.map((row) => range.map((col) => row * size + col)),
    ...range.map((col) => range.map((row) => row * size + col)),
    range.map((i) => i * size + i),
    range.map((i) => i * size + (size - 1 - i)),
  ];
}

export function completedLines(game: BingoGame): number[][] {
  return allLines(game.size).filter((line) => line.every((index) => isOpen(game.cells[index])));
}

/** まだ穴が空いていないマスのお題 */
export function remainingItemIds(game: BingoGame): string[] {
  return game.cells.flatMap((cell) => (cell.itemId !== null && !isOpen(cell) ? [cell.itemId] : []));
}

/** 判定結果でマスに穴を空け、ラインが揃えば終了にする */
export function applyJudge(game: BingoGame, found: readonly string[], photo: string, now: number): BingoGame {
  const cells = game.cells.map((cell) =>
    cell.itemId !== null && !isOpen(cell) && found.includes(cell.itemId) ? { ...cell, openedAt: now, photo } : cell,
  );
  const next: BingoGame = { ...game, cells, shots: game.shots + 1 };
  return completedLines(next).length > 0 ? { ...next, finishedAt: now, result: "bingo" } : next;
}

export function giveUp(game: BingoGame, now: number): BingoGame {
  return { ...game, finishedAt: now, result: "gaveUp" };
}

// --- 保存 ---
// お題を探して回るのに時間がかかるので、リロードしても続きから遊べるようにブラウザに保存する

const GAME_STORAGE_KEY = "clef-bingo-game";
const SIZE_STORAGE_KEY = "clef-bingo-size";

function isValidGame(value: unknown): value is BingoGame {
  if (typeof value !== "object" || value === null) return false;
  const game = value as Partial<BingoGame>;
  const theme = typeof game.themeId === "string" ? findTheme(game.themeId) : undefined;
  return (
    theme !== undefined &&
    typeof game.id === "string" &&
    BINGO_SIZES.includes(game.size as BingoSize) &&
    typeof game.startedAt === "number" &&
    typeof game.shots === "number" &&
    Array.isArray(game.cells) &&
    game.cells.length === game.size! * game.size! &&
    game.cells.every(
      (cell: BingoCell) =>
        typeof cell === "object" &&
        cell !== null &&
        (cell.itemId === null || (typeof cell.itemId === "string" && findItem(theme, cell.itemId) !== undefined)),
    )
  );
}

export function loadGame(): BingoGame | null {
  try {
    const saved = localStorage.getItem(GAME_STORAGE_KEY);
    if (!saved) return null;
    const game: unknown = JSON.parse(saved);
    return isValidGame(game) ? game : null;
  } catch {
    return null;
  }
}

export function saveGame(game: BingoGame | null): void {
  try {
    if (game) {
      localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(game));
    } else {
      localStorage.removeItem(GAME_STORAGE_KEY);
    }
  } catch {
    // 容量が足りないときは写真を諦めて、穴の位置だけでも残す
    try {
      if (game) {
        const withoutPhotos = { ...game, cells: game.cells.map(({ photo: _, ...cell }) => cell) };
        localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(withoutPhotos));
      }
    } catch {
      // 保存できなくても遊ぶことはできる
    }
  }
}

export function loadSize(): BingoSize {
  try {
    const saved = Number(localStorage.getItem(SIZE_STORAGE_KEY));
    if (BINGO_SIZES.includes(saved as BingoSize)) return saved as BingoSize;
  } catch {
    // ストレージが使えなくても既定のサイズで遊べる
  }
  return 3;
}

export function saveSize(size: BingoSize): void {
  try {
    localStorage.setItem(SIZE_STORAGE_KEY, String(size));
  } catch {
    // 保存できなくても選択は反映する
  }
}
