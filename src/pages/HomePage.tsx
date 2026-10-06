import { Link } from "react-router";

type Demo = {
  path: string;
  emoji: string;
  title: string;
  description: string;
};

const DEMOS: Demo[] = [
  {
    path: "/janken",
    emoji: "😄✊",
    title: "表情じゃんけん",
    description: "笑顔・驚いた顔・怒った顔でコンピューターとじゃんけん。インカメラで撮った表情を Clef が判定します。",
  },
  {
    path: "/avatar",
    emoji: "🧑‍🎨✨",
    title: "アバターメーカー",
    description: "顔の写真について Clef が 31 個の質問に答え、その答えからあなたに似たアバターを組み立てます。",
  },
];

export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="card-pop relative overflow-hidden px-6 py-8 sm:px-10 sm:py-12">
        <div className="absolute -top-10 -right-10 size-40 rounded-full bg-cf-yellow/40" />
        <div className="absolute -right-4 -bottom-16 size-32 rounded-full bg-cf-orange/20" />
        <div className="relative">
          <p className="mb-2 inline-block rounded-full bg-cf-peach px-3 py-1 text-xs font-extrabold text-cf-orange-dark">
            @cf/cloudflare/clef
          </p>
          <h1 className="text-4xl leading-tight font-black sm:text-5xl">
            <span className="text-cf-orange">Clef</span> で遊ぼう！
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed font-bold text-ink/80">
            Clef は Cloudflare Workers AI の「判断」に特化したモデル。テキストや画像と、選択肢つきの質問を渡すと、選択肢ごとの確率を返してくれます。
            ここではその Clef を使ったデモを集めています。
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-black">デモ</h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEMOS.map((demo) => (
            <li key={demo.path}>
              <Link
                to={demo.path}
                className="card-pop group flex h-full flex-col p-6 transition-transform hover:-translate-y-1 hover:rotate-[-0.5deg]"
              >
                <span className="mb-3 text-5xl group-hover:animate-wiggle">{demo.emoji}</span>
                <span className="text-xl font-black">{demo.title}</span>
                <span className="mt-2 flex-1 text-sm leading-relaxed font-bold text-ink/70">{demo.description}</span>
                <span className="mt-4 font-black text-cf-orange">あそぶ →</span>
              </Link>
            </li>
          ))}
          <li className="flex min-h-48 flex-col items-center justify-center rounded-[28px] border-[3px] border-dashed border-ink/30 p-6 text-center font-black text-ink/40">
            <span className="mb-2 text-4xl">🛠️</span>
            Coming soon...
          </li>
        </ul>
      </section>
    </div>
  );
}
