import { useCallback, useRef, useState } from "react";

export type Tool = "pen" | "eraser";

/** 1 本の線。座標はキャンバスの幅を 1 とした値で、[x0, y0, x1, y1, ...] と並べる */
export type Stroke = { tool: Tool; points: number[] };

// 線の太さ（キャンバスの幅に対する割合）。表示と書き出しで大きさが変わっても見た目をそろえる
const LINE_WIDTH: Record<Tool, number> = { pen: 0.014, eraser: 0.07 };
const INK = "#000000";
const PAPER = "#ffffff";

export function setStrokeStyle(ctx: CanvasRenderingContext2D, tool: Tool, size: number) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = LINE_WIDTH[tool] * size;
  ctx.strokeStyle = tool === "pen" ? INK : PAPER;
  ctx.fillStyle = ctx.strokeStyle;
}

/** 点を 1 つだけ打った線は、太さぶんの丸にする */
export function drawDot(ctx: CanvasRenderingContext2D, tool: Tool, size: number, x: number, y: number) {
  setStrokeStyle(ctx, tool, size);
  ctx.beginPath();
  ctx.arc(x * size, y * size, ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawSegment(ctx: CanvasRenderingContext2D, tool: Tool, size: number, from: [number, number], to: [number, number]) {
  setStrokeStyle(ctx, tool, size);
  ctx.beginPath();
  ctx.moveTo(from[0] * size, from[1] * size);
  ctx.lineTo(to[0] * size, to[1] * size);
  ctx.stroke();
}

/** 白い紙に線を全部描き直す。消しゴムは白い線として描く */
export function renderStrokes(ctx: CanvasRenderingContext2D, strokes: readonly Stroke[], size: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, size, size);
  for (const { tool, points } of strokes) {
    if (points.length === 2) {
      drawDot(ctx, tool, size, points[0], points[1]);
      continue;
    }
    setStrokeStyle(ctx, tool, size);
    ctx.beginPath();
    ctx.moveTo(points[0] * size, points[1] * size);
    for (let i = 2; i < points.length; i += 2) {
      ctx.lineTo(points[i] * size, points[i + 1] * size);
    }
    ctx.stroke();
  }
}

/** 判定に送るための、正方形の PNG の data URL */
export function exportDrawing(strokes: readonly Stroke[], size: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not supported");
  renderStrokes(ctx, strokes, size);
  return canvas.toDataURL("image/png");
}

export function hasInk(strokes: readonly Stroke[]): boolean {
  return strokes.some((stroke) => stroke.tool === "pen");
}

/**
 * 描いた線の履歴。「全部消す」も 1 つの操作として扱い、元に戻せるようにする。
 * 時間切れの瞬間に描きかけの線を足してすぐ書き出せるよう、最新の線は ref でも持つ
 */
export function useDrawingHistory() {
  type History = { entries: Stroke[][]; index: number };
  const [history, setHistory] = useState<History>({ entries: [[]], index: 0 });
  // 同じイベントの中で続けて呼ばれても最新の履歴に積めるよう、ref を正とする
  const historyRef = useRef(history);
  const latestRef = useRef<Stroke[]>([]);

  const update = useCallback((next: History) => {
    historyRef.current = next;
    latestRef.current = next.entries[next.index];
    setHistory(next);
  }, []);

  const push = useCallback(
    (strokes: Stroke[]) => {
      const { entries, index } = historyRef.current;
      update({ entries: [...entries.slice(0, index + 1), strokes], index: index + 1 });
    },
    [update],
  );

  const addStroke = useCallback((stroke: Stroke) => push([...latestRef.current, stroke]), [push]);

  const clear = useCallback(() => {
    if (latestRef.current.length > 0) push([]);
  }, [push]);

  const move = useCallback(
    (delta: number) => {
      const { entries, index } = historyRef.current;
      const nextIndex = index + delta;
      if (nextIndex >= 0 && nextIndex < entries.length) update({ entries, index: nextIndex });
    },
    [update],
  );
  const undo = useCallback(() => move(-1), [move]);
  const redo = useCallback(() => move(1), [move]);
  const reset = useCallback(() => update({ entries: [[]], index: 0 }), [update]);

  return {
    strokes: history.entries[history.index],
    latestRef,
    canUndo: history.index > 0,
    canRedo: history.index < history.entries.length - 1,
    addStroke,
    clear,
    undo,
    redo,
    reset,
  };
}
