import { EXPRESSION_TO_HAND, EXPRESSIONS, type JudgeResponse } from "../../../shared/janken";
import { EXPRESSION_EMOJI, EXPRESSION_LABEL, HAND_EMOJI } from "./labels";

export function ProbabilityBars({ judge }: { judge: JudgeResponse }) {
  return (
    <div className="card-pop space-y-4 p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-black">Clef の判定</h3>
        <p className="text-xs font-bold text-ink/60">
          {judge.model} · {judge.latencyMs}ms
        </p>
      </div>

      <ul className="space-y-2.5">
        {EXPRESSIONS.map((expression) => {
          const probability = judge.probabilities[expression] ?? 0;
          const hand = EXPRESSION_TO_HAND[expression];
          const isChosen = expression === judge.expression;
          return (
            <li key={expression} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-sm font-extrabold">
                {EXPRESSION_EMOJI[expression]} {EXPRESSION_LABEL[expression]}
              </span>
              <span className="relative h-6 flex-1 overflow-hidden rounded-full border-2 border-ink bg-cf-cream">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out ${
                    isChosen ? "bg-cf-orange" : "bg-cf-yellow/60"
                  }`}
                  style={{ width: `${probability * 100}%` }}
                />
              </span>
              <span className="w-12 shrink-0 text-right text-sm font-black tabular-nums">
                {Math.round(probability * 100)}%
              </span>
              <span className="w-6 shrink-0 text-center">{hand ? HAND_EMOJI[hand] : "－"}</span>
            </li>
          );
        })}
      </ul>

      <dl className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
        <div className="rounded-2xl bg-cf-cream px-3 py-2">
          <dt className="text-ink/60">確信度</dt>
          <dd className="text-lg font-black">{Math.round(judge.confidence * 100)}%</dd>
        </div>
        <div className="rounded-2xl bg-cf-cream px-3 py-2">
          <dt className="text-ink/60">顔が写っている確率</dt>
          <dd className="text-lg font-black">{Math.round(judge.faceProbability * 100)}%</dd>
        </div>
      </dl>
    </div>
  );
}
