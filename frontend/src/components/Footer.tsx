import { Database, Ticket, Terminal } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/8">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400 text-ink-950">
              <Ticket className="h-4 w-4 -rotate-12" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold text-white">CineSeat</span>
          </div>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-500">
            A real-time cinema booking demo built on the existing movie_booking PostgreSQL database.
            No mock availability, no shortcuts around the constraint.
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Under the hood
          </p>
          <ul className="mt-3 space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
              React + Vite + Tailwind
            </li>
            <li className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
              Express + TypeScript + pg
            </li>
            <li className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
              PostgreSQL 23505 handling
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Already in the repo
          </p>
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-400">
            <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden="true" />
            <span>
              The original CLI race simulator is still available:{' '}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-gold-200/80">
                npm run book -- --show 1 --seat 5 --customer 4
              </code>
            </span>
          </p>
        </div>
      </div>

      <div className="border-t border-white/6 px-4 py-4 text-center text-[10px] text-slate-600 sm:px-6 lg:px-8">
        CineSeat demo · Movie data comes from the movie_booking database · Built for concurrency
        testing
      </div>
    </footer>
  );
}
