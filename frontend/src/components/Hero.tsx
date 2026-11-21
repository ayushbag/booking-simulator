import { ArrowDown, Database, Radio, Sparkles, Ticket } from 'lucide-react';
import { pluralize } from '../format';

interface HeroProps {
  movieCount: number | null;
}

const HIGHLIGHTS = [
  { icon: Database, label: 'PostgreSQL source of truth' },
  { icon: Radio, label: 'Live updates every 2s' },
  { icon: Ticket, label: 'One transaction per booking' },
];

export function Hero({ movieCount }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-14 pb-4 sm:pt-20">
      <div
        className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[420px] w-[820px] max-w-[130vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(242,196,93,0.13),transparent_65%)] blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-8 right-[8%] -z-10 hidden h-64 w-64 rotate-12 rounded-[2rem] border border-white/[0.045] lg:block"
        aria-hidden="true"
      >
        <div className="absolute inset-4 rounded-[1.5rem] border border-dashed border-white/[0.05]" />
      </div>
      <div
        className="pointer-events-none absolute top-24 left-[6%] -z-10 hidden h-36 w-36 -rotate-12 rounded-3xl border border-white/[0.04] lg:block"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/25 bg-gold-400/[0.08] px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-gold-200 uppercase">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Now showing · Pune &amp; Mumbai
          </span>
          {movieCount !== null && movieCount > 0 && (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-medium text-slate-400">
              {pluralize(movieCount, 'film')} on the marquee
            </span>
          )}
        </div>

        <h1 className="mt-6 font-display text-[2.6rem] leading-[1.03] font-semibold tracking-[-0.03em] text-white sm:text-6xl lg:text-[4.4rem]">
          Big screen. Live seats.
          <span className="block text-gold-300 italic">No double bookings.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
          Choose a film, pick a showtime and claim your exact seat. Availability streams straight
          from PostgreSQL, so the seat you see is the seat you get.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <a
            href="#movies"
            className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-3 text-sm font-semibold text-ink-950 shadow-[0_16px_40px_-18px_rgba(242,196,93,0.85)] transition hover:bg-gold-300 active:translate-y-px"
          >
            Browse movies
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href="#race"
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <Ticket className="h-4 w-4 text-gold-300/80" aria-hidden="true" />
            Try the two-tab race
          </a>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-slate-500">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
