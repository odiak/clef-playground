export const LANGS = ["ja", "en"] as const;
export type Lang = (typeof LANGS)[number];

/** 言語ごとの文言 */
export type Localized = Record<Lang, string>;

/**
 * 言語の優先順位のリスト（navigator.languages や Accept-Language）から、対応している言語を選ぶ。
 * 日本語と英語のうち先に出てきたほうにし、どちらもなければ英語にする
 */
export function pickLang(preferred: readonly string[]): Lang {
  for (const tag of preferred) {
    const lang = tag.trim().toLowerCase().split("-")[0];
    if (lang === "ja" || lang === "en") return lang;
  }
  return "en";
}
