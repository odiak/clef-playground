import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type Lang, LANGS, pickLang } from "../../shared/i18n";

const STORAGE_KEY = "clef-lang";

/** 切り替えて保存した言語があればそれを、なければブラウザの言語設定から選ぶ */
function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(saved as Lang)) return saved as Lang;
  } catch {
    // ストレージが使えなくてもブラウザの言語設定で決める
  }
  return pickLang(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void } | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 保存できなくても切り替えは反映する
    }
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LangContext value={value}>{children}</LangContext>;
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) throw new Error("useLang must be used inside LangProvider");
  return context;
}

/** 言語ごとの文言のまとまり。英語は日本語と同じ形にする */
export function defineMessages<T>(messages: { ja: T; en: NoInfer<T> }): Record<Lang, T> {
  return messages;
}

/** 今の言語の文言を取り出す */
export function useMessages<T>(messages: Record<Lang, T>): T {
  return messages[useLang().lang];
}
