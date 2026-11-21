import { Ticket } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="group flex items-center gap-2.5" aria-label="CineSeat home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-500 text-ink-950 shadow-[0_8px_24px_-8px_rgba(242,196,93,0.7)] transition group-hover:scale-105">
            <Ticket className="h-4.5 w-4.5 -rotate-12" strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span>
            <span className="block font-display text-lg leading-none font-semibold tracking-tight text-white">
              CineSeat
            </span>
            <span className="mt-1 block text-[8px] font-semibold tracking-[0.24em] text-slate-500 uppercase">
              Movie booking
            </span>
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-[10px] font-semibold text-emerald-200 sm:inline-flex">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
            </span>
            Live seat sync
          </span>

          <nav className="flex items-center gap-1 text-xs font-medium text-slate-400">
            <a
              href="#movies"
              className="rounded-lg px-2.5 py-2 transition hover:bg-white/5 hover:text-white"
            >
              Movies
            </a>
            <a
              href="#race"
              className="hidden rounded-lg px-2.5 py-2 transition hover:bg-white/5 hover:text-white sm:block"
            >
              Two-tab test
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
