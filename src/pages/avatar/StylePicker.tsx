import { useMemo } from "react";
import { AVATAR_STAGES, type AvatarStageId } from "../../../shared/avatar";
import { Avatar, AVATAR_STYLES, type AvatarStyleId } from "./Avatar";
import { defineMessages, useLang, useMessages } from "../../lib/i18n";
import type { AvatarParams } from "./params";

const MESSAGES = defineMessages({
  ja: { label: "アバターのスタイル" },
  en: { label: "Avatar style" },
});

/** 同じ回答から描いた各スタイルのアバターを並べて選ばせる */
export function StylePicker({
  params,
  value,
  onChange,
}: {
  params: AvatarParams;
  value: AvatarStyleId;
  onChange: (style: AvatarStyleId) => void;
}) {
  const { lang } = useLang();
  const t = useMessages(MESSAGES);
  const stages = useMemo(() => new Set<AvatarStageId>(AVATAR_STAGES.map((stage) => stage.id)), []);
  return (
    <div role="radiogroup" aria-label={t.label} className="grid grid-cols-6 gap-1.5">
      {AVATAR_STYLES.map((style) => {
        const selected = style.id === value;
        return (
          <button
            key={style.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(style.id)}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`block aspect-square w-full overflow-hidden rounded-2xl border-[3px] transition-transform ${
                selected ? "-translate-y-0.5 border-cf-orange shadow-[0_3px_0_0_var(--color-cf-orange)]" : "border-ink"
              }`}
            >
              <Avatar params={params} stages={stages} styleId={style.id} animate={false} />
            </span>
            <span className={`text-[10px] font-extrabold whitespace-nowrap ${selected ? "text-cf-orange" : "text-ink/70"}`}>
              {style.label[lang]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
