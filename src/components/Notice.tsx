import type { ReactNode } from "react";

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-3xl border-[3px] border-ink bg-white px-4 py-3 text-center text-sm font-bold">{children}</p>
  );
}
