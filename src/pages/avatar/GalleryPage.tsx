import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { AVATAR_QUESTIONS, AVATAR_STAGES, type AvatarAnswers, type AvatarStageId } from "../../../shared/avatar";
import { Avatar, AVATAR_STYLES } from "./Avatar";
import { random } from "./curves";
import { toAvatarParams } from "./params";

/** 回答をランダムに作る。見た目の確認用。fixed に入っている質問はその回答に固定する */
function randomAnswers(rand: () => number, fixed: Record<string, string>): AvatarAnswers {
  const answers: Record<string, unknown> = {};
  for (const [id, question] of Object.entries(AVATAR_QUESTIONS)) {
    if (question.type === "noul") {
      answers[id] = { type: "noul", noul: id in fixed ? (fixed[id] === "true" ? 1 : 0) : rand() };
    } else {
      const options = Object.keys(question.options);
      const choice = id in fixed ? fixed[id] : options[Math.floor(rand() * options.length)];
      answers[id] = { type: "choice", choice, probabilities: { [choice]: 1 }, confidence: 1 };
    }
  }
  return answers as AvatarAnswers;
}

/**
 * 開発用: いろいろな回答の組み合わせを並べて、見た目の崩れを確認する。
 * - seed, count: 乱数の種と数
 * - style: 1 つのスタイルだけを cols 列で敷き詰める
 * - text=0: パラメーターの表示を消す
 * - それ以外（hat=none など）: その質問の回答を固定する
 */
export function GalleryPage() {
  const [searchParams] = useSearchParams();
  const seed = Number(searchParams.get("seed") ?? 1);
  const count = Number(searchParams.get("count") ?? 8);
  const style = AVATAR_STYLES.find((s) => s.id === searchParams.get("style"));
  const cols = Number(searchParams.get("cols") ?? 6);
  const showText = searchParams.get("text") !== "0";
  const fixedKey = [...searchParams.entries()].filter(([key]) => key in AVATAR_QUESTIONS).map(([k, v]) => `${k}=${v}`).join("&");
  const stages = useMemo(() => new Set<AvatarStageId>(AVATAR_STAGES.map((stage) => stage.id)), []);
  const rows = useMemo(() => {
    const rand = random(seed);
    const fixed = Object.fromEntries(new URLSearchParams(fixedKey));
    return Array.from({ length: count }, () => toAvatarParams(randomAnswers(rand, fixed)));
  }, [seed, count, fixedKey]);

  if (style) {
    return (
      <div className="grid gap-1 bg-white p-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {rows.map((params, i) => (
          <div key={i} className="relative aspect-square border border-ink/30">
            <Avatar params={params} stages={stages} styleId={style.id} animate={false} />
            {showText && <span className="absolute top-0 left-0 bg-white/80 px-0.5 font-mono text-[9px]">{i}</span>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-white p-2">
      {rows.map((params, i) => (
        <div key={i}>
          {showText && (
            <p className="font-mono text-[10px] leading-tight break-all text-ink/60">
              #{i} {Object.entries(params).map(([k, v]) => `${k}=${v}`).join(" ")}
            </p>
          )}
          <div className="grid grid-cols-6 gap-1">
            {AVATAR_STYLES.map((style) => (
              <div key={style.id} className="aspect-square border border-ink/30">
                <Avatar params={params} stages={stages} styleId={style.id} animate={false} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
