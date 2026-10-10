import { type PointerEvent, type Ref, useEffect, useImperativeHandle, useRef } from "react";
import { drawDot, drawSegment, renderStrokes, type Stroke, type Tool } from "./drawing";

export type DrawingCanvasHandle = {
  /** 描きかけの線があれば、そこまでで 1 本の線として確定させる */
  flush: () => void;
};

/**
 * 指やマウスで黒い線を描くキャンバス。線の履歴は親が持ち、描き終わった線を onStroke で渡す。
 * 描いている途中の線は、ここで直接キャンバスに描き足す
 */
export function DrawingCanvas({
  ref,
  strokes,
  tool,
  disabled,
  onStroke,
  label,
}: {
  ref?: Ref<DrawingCanvasHandle>;
  strokes: readonly Stroke[];
  tool: Tool;
  disabled: boolean;
  onStroke: (stroke: Stroke) => void;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentRef = useRef<{ pointerId: number; stroke: Stroke } | null>(null);

  const context = () => canvasRef.current?.getContext("2d") ?? null;

  // 表示の大きさと画面の解像度に合わせて描き直す
  const strokesRef = useRef(strokes);
  useEffect(() => {
    strokesRef.current = strokes;
    const canvas = canvasRef.current;
    const ctx = context();
    if (canvas && ctx) renderStrokes(ctx, strokes, canvas.width);
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const size = Math.round(canvas.clientWidth * window.devicePixelRatio);
      if (size === 0 || size === canvas.width) return;
      canvas.width = size;
      canvas.height = size;
      const ctx = context();
      if (!ctx) return;
      renderStrokes(ctx, strokesRef.current, size);
      const current = currentRef.current;
      if (current) renderStrokes(ctx, [current.stroke], size);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const flush = () => {
    const current = currentRef.current;
    if (!current) return;
    currentRef.current = null;
    onStroke(current.stroke);
  };
  useImperativeHandle(ref, () => ({ flush }));

  // 描けなくなったら、描きかけの線はそこまでで確定させる
  useEffect(() => {
    if (disabled) flush();
  });

  const pointOf = (event: { clientX: number; clientY: number }): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    return [clamp((event.clientX - rect.left) / rect.width), clamp((event.clientY - rect.top) / rect.height)];
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    // 2 本目の指や、マウスの左ボタン以外は無視する
    if (disabled || currentRef.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const [x, y] = pointOf(event);
    currentRef.current = { pointerId: event.pointerId, stroke: { tool, points: [x, y] } };
    const ctx = context();
    if (ctx) drawDot(ctx, tool, event.currentTarget.width, x, y);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const current = currentRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const ctx = context();
    const size = event.currentTarget.width;
    // 速く動かしても線がカクカクしないよう、間引かれたイベントも拾う
    const events = event.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const e of events.length > 0 ? events : [event]) {
      const { points } = current.stroke;
      const from: [number, number] = [points[points.length - 2], points[points.length - 1]];
      const to = pointOf(e);
      if (from[0] === to[0] && from[1] === to[1]) continue;
      points.push(to[0], to[1]);
      if (ctx) drawSegment(ctx, current.stroke.tool, size, from, to);
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (currentRef.current?.pointerId === event.pointerId) flush();
  };

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(event) => event.preventDefault()}
      className={`block aspect-square w-full touch-none select-none [-webkit-touch-callout:none] ${
        disabled ? "" : tool === "pen" ? "cursor-crosshair" : "cursor-cell"
      }`}
    />
  );
}
