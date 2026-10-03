/**
 * video の中央を正方形に切り抜き、プレビューと同じく左右反転した JPEG の data URL を返す。
 * Clef に送るので、判定に十分かつ軽いサイズに縮小する。
 */
export function captureSquareFrame(video: HTMLVideoElement, size = 512): string {
  const { videoWidth: width, videoHeight: height } = video;
  const side = Math.min(width, height);
  const sx = (width - side) / 2;
  const sy = (height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not supported");

  context.translate(size, 0);
  context.scale(-1, 1);
  context.drawImage(video, sx, sy, side, side, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.85);
}
