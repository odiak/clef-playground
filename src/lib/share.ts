/** このブラウザが共有シートで画像を共有できるか */
export function canShareFiles(): boolean {
  try {
    return navigator.canShare?.({ files: [new File([], "image.png", { type: "image/png" })] }) ?? false;
  } catch {
    return false;
  }
}

/**
 * 画像を共有シート（スマホ）で共有し、共有できなければダウンロードする。
 * 共有シートはタップしてすぐに開かないと拒否されることがあるので、画像は先に作っておく
 */
export async function shareOrDownload(file: File, text?: string): Promise<void> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return;
    } catch (error) {
      // 共有シートを閉じただけなら何もしない
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
