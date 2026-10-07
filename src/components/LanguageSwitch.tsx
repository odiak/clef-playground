import { type Lang, LANGS } from "../../shared/i18n";
import { useLang } from "../lib/i18n";

const LABEL: Record<Lang, string> = { ja: "JA", en: "EN" };

/** 言語の切り替え。ふだんは自動で選ぶので、目立たない小さなボタンにする */
export function LanguageSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div role="radiogroup" aria-label="Language" className="flex rounded-full border-2 border-ink/30 bg-white p-0.5 text-[10px] font-extrabold">
      {LANGS.map((value) => {
        const selected = value === lang;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            lang={value}
            onClick={() => setLang(value)}
            className={`rounded-full px-2 py-0.5 transition-colors ${selected ? "bg-ink text-white" : "text-ink/50 hover:text-ink"}`}
          >
            {LABEL[value]}
          </button>
        );
      })}
    </div>
  );
}
