import { Link, Outlet } from "react-router";

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b-[3px] border-ink bg-cf-orange">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="size-9 rounded-xl border-2 border-ink bg-white" />
            <span className="text-xl font-black tracking-tight text-white drop-shadow-[2px_2px_0_var(--color-ink)]">
              Clef Playground
            </span>
          </Link>
          <span className="rounded-full border-2 border-ink bg-white px-3 py-0.5 text-xs font-extrabold">
            Workers AI
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center text-xs font-bold text-ink/60">
        Powered by{" "}
        <a
          href="https://developers.cloudflare.com/workers-ai/models/clef/"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-cf-orange decoration-2 underline-offset-2"
        >
          Clef on Cloudflare Workers AI
        </a>
      </footer>
    </div>
  );
}
