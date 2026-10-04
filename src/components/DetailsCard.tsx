import type { ReactNode } from "react";

/** 普段は閉じておく補足情報のカード */
export function DetailsCard({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <details className="group card-pop overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-3 [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-black">{title}</span>
        <span className="flex items-center gap-2 text-xs font-bold text-ink/60">
          {aside}
          <span className="text-cf-orange transition-transform group-open:rotate-180">▼</span>
        </span>
      </summary>
      <div className="space-y-5 border-t-[3px] border-ink px-5 pt-4 pb-5">{children}</div>
    </details>
  );
}
