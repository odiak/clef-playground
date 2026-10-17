import { useEffect, useState } from "react";
import type { Lang } from "../../../shared/i18n";
import { defineMessages, useLang, useMessages } from "../../lib/i18n";
import { canShareFiles, shareOrDownload } from "../../lib/share";
import type { SavedDrawing } from "./history";
import { createShareImage, shareText } from "./shareCard";

const MESSAGES = defineMessages({
  ja: {
    share: "📤 シェアする",
    download: "⬇️ 画像を保存",
    failed: "画像の作成に失敗しました",
  },
  en: {
    share: "📤 Share",
    download: "⬇️ Save image",
    failed: "Couldn't create the image",
  },
});

/** お題と判定結果を添えた画像を、共有シート（スマホ）かダウンロードでシェアする */
export function ShareButton({ drawing, className }: { drawing: SavedDrawing; className: string }) {
  const { lang } = useLang();
  const t = useMessages(MESSAGES);
  const [canShare] = useState(canShareFiles);

  // 共有シートはタップしてすぐに開かないと拒否されることがあるので、画像は先に作っておく
  const [prepared, setPrepared] = useState<{ drawing: SavedDrawing; lang: Lang; file: File } | null>(null);
  useEffect(() => {
    let active = true;
    createShareImage(drawing, lang).then(
      (file) => {
        if (active) setPrepared({ drawing, lang, file });
      },
      () => {
        // 押したときにもう一度作る
      },
    );
    return () => {
      active = false;
    };
  }, [drawing, lang]);

  const share = async () => {
    try {
      const file =
        prepared?.drawing === drawing && prepared.lang === lang ? prepared.file : await createShareImage(drawing, lang);
      await shareOrDownload(file, shareText(drawing, lang));
    } catch {
      window.alert(t.failed);
    }
  };

  return (
    <button type="button" className={className} onClick={share}>
      {canShare ? t.share : t.download}
    </button>
  );
}
