import { shareOrDownload } from "../../lib/share";

const SIZE = 1024;

/** SVG を PNG にして、共有シート（スマホ）かダウンロードで保存する */
export async function saveSvgAsPng(svg: SVGSVGElement, filename: string): Promise<void> {
  const source = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.width = SIZE;
    image.height = SIZE;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is not supported");
    context.drawImage(image, 0, 0, SIZE, SIZE);

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG の作成に失敗しました"))), "image/png"),
    );
    await shareOrDownload(new File([blob], filename, { type: "image/png" }));
  } finally {
    URL.revokeObjectURL(url);
  }
}
