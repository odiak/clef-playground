import { Link } from "react-router";
import { defineMessages, useMessages } from "../lib/i18n";
import { LanguageSwitch } from "./LanguageSwitch";

const MESSAGES = defineMessages({
  ja: { back: "← デモ一覧" },
  en: { back: "← All demos" },
});

/** ページの一番上の行。左にデモ一覧へ戻るリンク、右に言語の切り替え */
export function TopBar({ back = false }: { back?: boolean }) {
  const t = useMessages(MESSAGES);
  return (
    <div className="flex items-center justify-between gap-2">
      {back ? (
        <Link to="/" className="inline-block text-xs font-extrabold text-ink/60 hover:text-cf-orange">
          {t.back}
        </Link>
      ) : (
        <span />
      )}
      <LanguageSwitch />
    </div>
  );
}
