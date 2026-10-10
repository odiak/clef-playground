import type { Context } from "hono";
import { type Lang, type Localized, pickLang } from "../shared/i18n";

type PageMeta = {
  title: Localized;
  description: Localized;
  /** public/ 以下の OGP 画像のパス */
  image: string;
};

const SITE_NAME = "Clef Playground";

// SPA の HTML はクローラーが JavaScript を実行しないと中身が分からないので、
// ページごとの title と OGP タグを Worker で index.html に差し込む
export const PAGES: Record<string, PageMeta> = {
  "/": {
    title: { ja: SITE_NAME, en: SITE_NAME },
    description: {
      ja: "Cloudflare Workers AI の判断モデル Clef で遊ぶデモ集",
      en: "Demos to play with Clef, the judgment model on Cloudflare Workers AI",
    },
    image: "/ogp/janken.png",
  },
  "/janken": {
    title: { ja: `表情じゃんけん | ${SITE_NAME}`, en: `Rock Paper Faces | ${SITE_NAME}` },
    description: {
      ja: "笑顔・驚いた顔・怒った顔でコンピューターとじゃんけん！インカメラで撮った表情を Cloudflare Workers AI の Clef が判定します。",
      en: "Play rock-paper-scissors against the computer with a smile, a surprised face, or an angry face! Clef on Cloudflare Workers AI judges the expression from your front camera.",
    },
    image: "/ogp/janken.png",
  },
  "/avatar": {
    title: { ja: `アバターメーカー | ${SITE_NAME}`, en: `Avatar Maker | ${SITE_NAME}` },
    description: {
      ja: "顔の写真について Clef が 31 個の質問に答え、その答えからあなたに似たアバターを組み立てます。Cloudflare Workers AI の Clef を使ったデモ。",
      en: "Clef answers 31 questions about a photo of your face, and those answers become an avatar that looks like you. A demo of Clef on Cloudflare Workers AI.",
    },
    image: "/ogp/avatar.png",
  },
  "/bingo": {
    title: { ja: `写真ビンゴ | ${SITE_NAME}`, en: `Photo Bingo | ${SITE_NAME}` },
    description: {
      ja: "カードに並んだお題を探して撮影し、Clef が認めたらマスに穴が空く！縦・横・斜めに揃えばビンゴ。Cloudflare Workers AI の Clef を使ったデモ。",
      en: "Find the things on your card and snap a photo. When Clef recognizes one, the square is punched! Get a line for BINGO. A demo of Clef on Cloudflare Workers AI.",
    },
    image: "/ogp/bingo.png",
  },
  "/draw": {
    title: { ja: `描けるかな？ | ${SITE_NAME}`, en: `Can You Draw It? | ${SITE_NAME}` },
    description: {
      ja: "ランダムなお題を指やマウスでお絵かき。Clef がお題の絵に見えると判定したら合格！Cloudflare Workers AI の Clef を使ったデモ。",
      en: "Draw a random prompt with your finger or mouse. If Clef sees it as the prompt, you pass! A demo of Clef on Cloudflare Workers AI.",
    },
    image: "/ogp/draw.png",
  },
};

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

const OG_LOCALE: Record<Lang, string> = { ja: "ja_JP", en: "en_US" };

/**
 * ブラウザの言語設定（Accept-Language）からページの言語を選ぶ。
 * 言語設定を送ってこないクローラーには、これまでどおり日本語を返す
 */
function requestLang(header: string | undefined): Lang {
  const preferred = (header ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));
      return { tag: tag.trim(), q: q ? Number(q.trim().slice(2)) : 1 };
    })
    // 「*」は言語の指定がないのと同じに扱う
    .filter(({ tag }) => tag !== "" && tag !== "*")
    .sort((a, b) => b.q - a.q)
    .map(({ tag }) => tag);
  return preferred.length > 0 ? pickLang(preferred) : "ja";
}

function metaTags(meta: PageMeta, lang: Lang, url: URL): string {
  const imageUrl = new URL(meta.image, url.origin).toString();
  const properties: [string, string][] = [
    ["og:type", "website"],
    ["og:site_name", SITE_NAME],
    ["og:locale", OG_LOCALE[lang]],
    ["og:locale:alternate", OG_LOCALE[lang === "ja" ? "en" : "ja"]],
    ["og:title", meta.title[lang]],
    ["og:description", meta.description[lang]],
    ["og:url", new URL(url.pathname, url.origin).toString()],
    ["og:image", imageUrl],
    ["og:image:width", "1200"],
    ["og:image:height", "630"],
  ];
  const names: [string, string][] = [
    ["twitter:card", "summary_large_image"],
    ["twitter:creator", "@odiak_"],
  ];
  return [
    ...properties.map(([property, content]) => `<meta property="${property}" content="${escapeAttribute(content)}" />`),
    ...names.map(([name, content]) => `<meta name="${name}" content="${escapeAttribute(content)}" />`),
  ].join("\n");
}

export async function renderPage(c: Context<{ Bindings: Env }>, meta: PageMeta): Promise<Response> {
  const url = new URL(c.req.url);
  const lang = requestLang(c.req.header("accept-language"));
  const response = await c.env.ASSETS.fetch(new URL("/", url));

  const transformed = new HTMLRewriter()
    .on("html", {
      element(element) {
        element.setAttribute("lang", lang);
      },
    })
    .on("title", {
      element(element) {
        element.setInnerContent(meta.title[lang]);
      },
    })
    .on('meta[name="description"]', {
      element(element) {
        element.setAttribute("content", meta.description[lang]);
      },
    })
    .on("head", {
      element(element) {
        element.append(metaTags(meta, lang, url), { html: true });
      },
    })
    .transform(response);
  // 言語設定によって中身が変わるので、キャッシュが言語ごとに分かれるようにする
  const headers = new Headers(transformed.headers);
  headers.append("vary", "Accept-Language");
  return new Response(transformed.body, { status: transformed.status, headers });
}
