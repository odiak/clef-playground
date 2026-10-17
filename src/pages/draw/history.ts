import { useCallback, useEffect, useState } from "react";
import { type DrawJudgeResponse, findTopic } from "../../../shared/draw";
import type { Stroke, Tool } from "./drawing";

/** これまでに描いた絵。画像ではなく線を残し、表示やシェアする画像の大きさに合わせて描き直す */
export type SavedDrawing = {
  id: string;
  topicId: string;
  strokes: readonly Stroke[];
  judge: DrawJudgeResponse;
  drawnAt: number;
};

// 描いた絵はこのブラウザの中だけに保存する。localStorage は写真ビンゴの写真でも使うので、容量の大きい IndexedDB に置く
const DB_NAME = "clef-draw";
const STORE_NAME = "drawings";
// これより多くなったら、古いものから消す
export const MAX_SAVED_DRAWINGS = 100;
// 座標は 0〜1 を 16 ビットの整数にして、小さく保存する
const POINT_SCALE = 0xffff;

type StoredDrawing = Omit<SavedDrawing, "strokes"> & { strokes: { tool: Tool; points: Uint16Array }[] };

function encode(drawing: SavedDrawing): StoredDrawing {
  return {
    ...drawing,
    strokes: drawing.strokes.map(({ tool, points }) => ({
      tool,
      points: Uint16Array.from(points, (value) => Math.round(value * POINT_SCALE)),
    })),
  };
}

/** 壊れていたり、なくなったお題だったりするものは読み飛ばす */
function decode(value: unknown): SavedDrawing[] {
  if (typeof value !== "object" || value === null) return [];
  const stored = value as Partial<StoredDrawing>;
  const judge = stored.judge;
  const isValid =
    typeof stored.id === "string" &&
    typeof stored.topicId === "string" &&
    findTopic(stored.topicId) !== undefined &&
    typeof stored.drawnAt === "number" &&
    typeof judge === "object" &&
    judge !== null &&
    typeof judge.probability === "number" &&
    typeof judge.passed === "boolean" &&
    typeof judge.guesses === "object" &&
    judge.guesses !== null &&
    Array.isArray(stored.strokes) &&
    stored.strokes.every(
      (stroke) =>
        (stroke.tool === "pen" || stroke.tool === "eraser") &&
        stroke.points instanceof Uint16Array &&
        stroke.points.length >= 2 &&
        stroke.points.length % 2 === 0,
    );
  if (!isValid) return [];
  return [
    {
      ...(stored as StoredDrawing),
      strokes: stored.strokes!.map(({ tool, points }) => ({ tool, points: Array.from(points, (value) => value / POINT_SCALE) })),
    },
  ];
}

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  databasePromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      store.createIndex("drawnAt", "drawnAt");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return databasePromise;
}

function completion(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/** 新しい順 */
async function loadDrawings(): Promise<SavedDrawing[]> {
  const database = await openDatabase();
  const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
  const records = await new Promise<unknown[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return records.flatMap(decode).sort((a, b) => b.drawnAt - a.drawnAt);
}

async function putDrawing(drawing: SavedDrawing): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.put(encode(drawing));
  // 途中で await するとトランザクションが閉じてしまうので、古いものはコールバックの中で消す
  const keys = store.index("drawnAt").getAllKeys();
  keys.onsuccess = () => {
    for (const key of keys.result.slice(0, Math.max(0, keys.result.length - MAX_SAVED_DRAWINGS))) store.delete(key);
  };
  await completion(transaction);
}

async function deleteDrawing(id: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(id);
  await completion(transaction);
}

/** これまでに描いた絵の一覧（新しい順） */
export function useSavedDrawings() {
  const [drawings, setDrawings] = useState<SavedDrawing[]>([]);

  useEffect(() => {
    let active = true;
    loadDrawings().then(
      (loaded) => {
        if (active) setDrawings(loaded);
      },
      () => {
        // 読み込めなくても遊ぶことはできる
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const add = useCallback((drawing: SavedDrawing) => {
    setDrawings((current) => [drawing, ...current].slice(0, MAX_SAVED_DRAWINGS));
    putDrawing(drawing).catch(() => {
      // 保存できなくても、開いているあいだは一覧から見られる
    });
  }, []);

  const remove = useCallback((id: string) => {
    setDrawings((current) => current.filter((drawing) => drawing.id !== id));
    deleteDrawing(id).catch(() => {
      // 消せなかったものは、次に開いたときにまた出てくる
    });
  }, []);

  return { drawings, add, remove };
}
