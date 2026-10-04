import { CLEF_MODELS, type ClefModel } from "../../shared/clef";

export const MODEL_LABEL: Record<ClefModel, { name: string; note: string }> = {
  "clef-flash": { name: "Clef flash", note: "9B・はやい" },
  clef: { name: "Clef", note: "27B・かしこい" },
};

export function ModelToggle({
  value,
  onChange,
  disabled,
}: {
  value: ClefModel;
  onChange: (model: ClefModel) => void;
  disabled: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="判定に使うモデル" className="grid grid-cols-2 gap-1 rounded-full border-[3px] border-ink bg-white p-1">
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
              {MODEL_LABEL[model].note}
            </span>
          </button>
        );
      })}
    </div>
  );
}
