# Clef Playground

Cloudflare Workers AI の判断モデル [Clef / Clef flash](https://developers.cloudflare.com/workers-ai/models/clef/) を使ったデモ集。

## デモ

- **表情じゃんけん** (`/janken`): インカメラで撮った表情（笑顔＝パー、驚いた顔＝チョキ、怒った顔＝グー）を Clef が判定し、コンピューターとじゃんけんする
- **アバターメーカー** (`/avatar`): 撮った顔写真について Clef が髪型や目の形など 31 の質問に答え、その答えからアバターを段階的に組み立てる
- **写真ビンゴ** (`/bingo`): ランダムなテーマのお題が並んだビンゴカード（3×3 か、中央が FREE の 5×5）を、外カメラで撮った写真で埋めていく。1 枚の写真について、まだ空いていないマスのお題が写っているかと、画面や印刷物ではなく実物を撮ったかを Clef にまとめて聞く

## 写真ビンゴのお題

テーマとお題は `shared/bingo.ts` にある。日本以外でも遊べるよう、どこの家や街にもありそうなものを選んでいる。

- 各テーマは 5×5 の 24 マスを埋められるよう、24 個以上のお題を持つ
- `label` は画面に出す名前で、マスに収まるよう短くする。`prompt` は Clef への質問（`Does the photo clearly show ...?`）に入る英語の名詞句で、表示名より広く言い換えてよい
- スマホやテレビなど画面そのものは、実物かどうかの判定とぶつかるのでお題にしない
- 遊んでいるカードは、撮った写真の縮小版ごと localStorage に保存し、リロードしても続きから遊べる

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

## 多言語対応

画面は日本語と英語に対応している。

- 言語はブラウザの言語設定から自動で選び（日本語と英語のうち優先度が高いほう、どちらもなければ英語）、ページ右上の切り替えで選んだ言語は localStorage に保存する（`src/lib/i18n.tsx`）
- 文言は使う場所の近くに `defineMessages({ ja: {...}, en: {...} })` でまとめて書く。アバターの質問や選択肢の表示名は `shared/avatar.ts` の `label: { ja, en }`
- API のエラーは文言ではなくエラーの種類（`shared/api.ts` の `ErrorCode`）を返し、画面で言語に合わせた文言にする（`src/lib/errors.ts`）
- ページの title と OGP タグは、Worker が `Accept-Language` を見て出し分ける。言語設定を送ってこないクローラーには日本語を返す（`worker/pages.ts`）。OGP 画像は日本語のみ

## アバターの見た目の確認

開発サーバーで `/avatar/gallery` を開くと、ランダムな回答で作ったアバターを全スタイルで並べて確認できる（本番には含めない）。

- `seed`, `count`: 乱数の種と数
- `style=anime&cols=6`: 1 つのスタイルだけを敷き詰める
- `hat=none` のように質問 ID を指定すると、その回答に固定する
- `text=0`: パラメーターの表示を消す

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
