import { CLEF_MODELS, type ClefModel } from "../../shared/clef";
import type { Localized } from "../../shared/i18n";
import { defineMessages, useLang, useMessages } from "../lib/i18n";

export const MODEL_LABEL: Record<ClefModel, { name: string; note: Localized }> = {
  "clef-flash": { name: "Clef flash", note: { ja: "9B・はやい", en: "9B · fast" } },
  clef: { name: "Clef", note: { ja: "27B・かしこい", en: "27B · smart" } },
};

const MESSAGES = defineMessages({
  ja: { label: "判定に使うモデル" },
  en: { label: "Model used for judging" },
});

export function ModelToggle({
  value,
  onChange,
  disabled,
}: {
  value: ClefModel;
  onChange: (model: ClefModel) => void;
  disabled: boolean;
}) {
  const { lang } = useLang();
  const t = useMessages(MESSAGES);
  return (
    <div role="radiogroup" aria-label={t.label} className="grid grid-cols-2 gap-1 rounded-full border-[3px] border-ink bg-white p-1">
      {CLEF_MODELS.map((model) => {
        const selected = model === value;
        return (
          <button
            key={model}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(model)}
            className={`rounded-full px-3 py-1 transition-colors disabled:cursor-not-allowed ${
              selected ? "bg-cf-orange text-white" : "text-ink/70 hover:bg-cf-cream"
            }`}
          >
            <span className="block text-sm leading-tight font-black">{MODEL_LABEL[model].name}</span>
            <span className={`block text-[10px] font-bold ${selected ? "text-white/85" : "text-ink/50"}`}>
              {MODEL_LABEL[model].note[lang]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
