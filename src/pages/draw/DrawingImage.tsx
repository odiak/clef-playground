import { useEffect, useRef } from "react";
import { renderStrokes, type Stroke } from "./drawing";

/** 描いた線を、表示の大きさと画面の解像度に合わせて描いた絵 */
export function DrawingImage({ strokes, label, className = "" }: { strokes: readonly Stroke[]; label: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ResizeObserver は監視を始めたときにも呼ばれるので、最初の描画もここでする
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const size = Math.round(canvas.clientWidth * window.devicePixelRatio);
      if (size === 0) return;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (ctx) renderStrokes(ctx, strokes, size);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [strokes]);

  return <canvas ref={canvasRef} role="img" aria-label={label} className={`block aspect-square w-full bg-white ${className}`} />;
}
