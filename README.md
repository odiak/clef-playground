# Clef Playground

Cloudflare Workers AI の判断モデル [Clef / Clef flash](https://developers.cloudflare.com/workers-ai/models/clef/) を使ったデモ集。

## デモ

- **表情じゃんけん** (`/janken`): インカメラで撮った表情（笑顔＝パー、驚いた顔＝チョキ、怒った顔＝グー）を Clef が判定し、コンピューターとじゃんけんする
- **アバターメーカー** (`/avatar`): 撮った顔写真について Clef が髪型や目の形など 31 の質問に答え、その答えからアバターを段階的に組み立てる

## 構成

- `src/` — フロントエンド（Vite + React + Tailwind CSS）
- `worker/` — API（Hono）。`worker/lib/clef.ts` に Clef 呼び出しの型と共通処理
- `shared/` — フロントエンドと Worker で共有する型

静的アセットと API を 1 つの Worker で配信する。`/api/*` だけが Worker のコードに渡る。

## 開発

```bash
npm install
npx wrangler login
npm run dev
```

Workers AI のバインディングはローカル開発でもリモートの Cloudflare に接続するので、実際に利用料が発生する。

スマホ実機での確認にはカメラのために HTTPS が必要。`cloudflared tunnel --url http://localhost:5173` などで公開するか、デプロイして確認する。

`wrangler.jsonc` を変更したら `npm run cf-typegen` で `worker-configuration.d.ts` を再生成する。

## OGP 画像

`ogp/*.html` をヘッドレス Chrome で 1200×630 の PNG にして `public/ogp/` に置いている。ページごとの title と OGP タグは `worker/pages.ts` で `index.html` に差し込む。

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --window-size=1200,630 --force-device-scale-factor=1 --virtual-time-budget=8000 \
  --screenshot="$PWD/public/ogp/janken.png" "file://$PWD/ogp/janken.html"
```

アバターメーカーの `ogp/avatar.html` に埋め込んだアバターの SVG は、アプリで描いたものをそのまま書き出している。

## デプロイ

```bash
npm run deploy
```
