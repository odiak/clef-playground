import type { Context } from "hono";

type PageMeta = {
  title: string;
  description: string;
  /** public/ 以下の OGP 画像のパス */
  image: string;
};

const SITE_NAME = "Clef Playground";

// SPA の HTML はクローラーが JavaScript を実行しないと中身が分からないので、
// ページごとの title と OGP タグを Worker で index.html に差し込む
export const PAGES: Record<string, PageMeta> = {
  "/": {
    title: SITE_NAME,
    description: "Cloudflare Workers AI の判断モデル Clef で遊ぶデモ集",
    image: "/ogp/janken.png",
  },
  "/janken": {
    title: `表情じゃんけん | ${SITE_NAME}`,
    description:
      "笑顔・驚いた顔・怒った顔でコンピューターとじゃんけん！インカメラで撮った表情を Cloudflare Workers AI の Clef が判定します。",
    image: "/ogp/janken.png",
  },
  "/avatar": {
    title: `アバターメーカー | ${SITE_NAME}`,
    description:
      "顔の写真について Clef が 25 個の質問に答え、その答えからあなたに似たアバターを組み立てます。Cloudflare Workers AI の Clef を使ったデモ。",
    image: "/ogp/avatar.png",
  },
};

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function metaTags(meta: PageMeta, url: URL): string {
  const imageUrl = new URL(meta.image, url.origin).toString();
  const properties: [string, string][] = [
    ["og:type", "website"],
    ["og:site_name", SITE_NAME],
    ["og:locale", "ja_JP"],
    ["og:title", meta.title],
    ["og:description", meta.description],
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
  const response = await c.env.ASSETS.fetch(new URL("/", url));

  return new HTMLRewriter()
    .on("title", {
      element(element) {
        element.setInnerContent(meta.title);
      },
    })
    .on('meta[name="description"]', {
      element(element) {
        element.setAttribute("content", meta.description);
      },
    })
    .on("head", {
      element(element) {
        element.append(metaTags(meta, url), { html: true });
      },
    })
    .transform(response);
}
