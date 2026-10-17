import { useState } from "react";
import { AVATAR_QUESTIONS, AVATAR_STAGES, type AvatarAnswers, type AvatarQuestionId, type AvatarStageId } from "../../../shared/avatar";
import type { Localized } from "../../../shared/i18n";
import { defineMessages, useLang, useMessages } from "../../lib/i18n";
import { CLOTHES, HAIR, IRIS, SKIN } from "./palette";
import { answerValue, type AvatarOverrides } from "./params";

const MESSAGES = defineMessages({
  ja: {
    lead: "読み取りがちがうところを選び直せます（点線の枠が Clef の答え）",
    resetAll: "すべて元に戻す",
    reset: "元に戻す",
    clef: "Clef の答え",
    yes: "はい",
    no: "いいえ",
  },
  en: {
    lead: "Fix anything Clef got wrong (dashed = Clef's answer)",
    resetAll: "Reset all",
    reset: "Reset",
    clef: "Clef's answer",
    yes: "Yes",
    no: "No",
  },
});

/** 選択肢に色見本を付ける質問 */
const SWATCHES: Partial<Record<AvatarQuestionId, Record<string, string>>> = {
  skin_tone: SKIN,
  hair_color: HAIR,
  clothing_color: CLOTHES,
  eye_color: IRIS,
};

/** 完成したアバターの回答を、段階ごとに選び直させる */
export function AvatarEditor({
  answers,
  overrides,
  onChange,
}: {
  /** Clef の回答 */
  answers: AvatarAnswers;
  overrides: AvatarOverrides;
  onChange: (overrides: AvatarOverrides) => void;
}) {
  const { lang } = useLang();
  const t = useMessages(MESSAGES);
  const [stageId, setStageId] = useState<AvatarStageId>(AVATAR_STAGES[0].id);
  const stage = AVATAR_STAGES.find((s) => s.id === stageId) ?? AVATAR_STAGES[0];
  const isEdited = (id: AvatarQuestionId) => id in overrides;

  const set = (id: AvatarQuestionId, value: string | boolean) => {
    const next: Record<string, string | boolean> = { ...overrides };
    // Clef の答えに戻したら、直していないのと同じ扱いにする
    if (value === answerValue(answers, id)) delete next[id];
    else next[id] = value;
    onChange(next as AvatarOverrides);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-ink/60">{t.lead}</p>
        <button
          type="button"
          onClick={() => onChange({})}
          disabled={Object.keys(overrides).length === 0}
          className="shrink-0 text-xs font-extrabold text-ink/50 underline underline-offset-2 disabled:invisible"
        >
          {t.resetAll}
        </button>
      </div>

      <div role="tablist" className="-mx-1 flex flex-wrap gap-1.5 px-1">
        {AVATAR_STAGES.map((s) => {
          const selected = s.id === stage.id;
          const edited = (s.questions as readonly AvatarQuestionId[]).some(isEdited);
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setStageId(s.id)}
              className={`relative rounded-full border-2 border-ink px-3 py-1 text-xs font-black ${
                selected ? "bg-ink text-white" : "bg-white"
              }`}
            >
              {s.label[lang]}
              {edited && <span className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-white bg-cf-orange" />}
            </button>
          );
        })}
      </div>

      <ul role="tabpanel" className="space-y-2">
        {(stage.questions as readonly AvatarQuestionId[]).map((id) => {
          const question = AVATAR_QUESTIONS[id];
          const clefValue: string | boolean = answerValue(answers, id);
          const value: string | boolean = overrides[id] ?? clefValue;
          const options: { value: string | boolean; label: string }[] =
            question.type === "noul"
              ? [
                  { value: true, label: t.yes },
                  { value: false, label: t.no },
                ]
              : Object.entries(question.options as Record<string, { label: Localized }>).map(([option, { label }]) => ({
                  value: option,
                  label: label[lang],
                }));
          const swatches = SWATCHES[id];
          return (
            <li key={id} className="space-y-1.5 rounded-2xl bg-cf-cream px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold">{question.label[lang]}</span>
                {isEdited(id) && (
                  <button
                    type="button"
                    onClick={() => set(id, clefValue)}
                    className="shrink-0 text-xs font-extrabold text-cf-orange-dark underline underline-offset-2"
                  >
                    ↺ {t.reset}
                  </button>
                )}
              </div>
              <div role="radiogroup" aria-label={question.label[lang]} className="flex flex-wrap gap-1.5">
                {options.map((option) => {
                  const selected = option.value === value;
                  const isClef = option.value === clefValue;
                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      title={isClef ? t.clef : undefined}
                      onClick={() => set(id, option.value)}
                      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-xs font-black transition-colors ${
                        selected ? "border-ink bg-cf-orange text-white" : isClef ? "border-dashed border-ink/60 bg-white" : "border-ink/20 bg-white"
                      }`}
                    >
                      {swatches && typeof option.value === "string" && (
                        <span className="size-3.5 shrink-0 rounded-full border-2 border-ink" style={{ background: swatches[option.value] }} />
                      )}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
