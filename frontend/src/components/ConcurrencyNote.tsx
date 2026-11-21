import { CheckCircle2, MousePointerClick, ShieldAlert, SplitSquareHorizontal } from 'lucide-react';

const STEPS = [
  {
    icon: SplitSquareHorizontal,
    title: 'Open two tabs',
    body: 'Load the same show in two browser windows. Both tabs poll availability independently.',
  },
  {
    icon: MousePointerClick,
    title: 'Pick the same seat',
    body: 'Select one free seat in each tab, choose a customer, then press Book almost together.',
  },
  {
    icon: ShieldAlert,
    title: 'Let PostgreSQL decide',
    body: 'One transaction commits. The other is rejected by unique_active_show_seat with a 409 conflict.',
  },
];

export function ConcurrencyNote() {
  return (
    <section id="race" className="scroll-mt-24 pt-16 sm:pt-24">
      <div className="surface relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div
          className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(242,196,93,0.11),transparent_68%)]"
          aria-hidden="true"
        />

        <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Built for real races</p>
            <h2 className="mt-2 font-display text-2xl leading-tight font-semibold text-white sm:text-3xl">
              Two tabs. One seat. One winner.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
              There is no application-level seat lock. Every booking opens a dedicated PostgreSQL
              connection and transaction, and the existing partial unique index is the final judge.
            </p>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-3.5 font-mono text-[11px] leading-relaxed text-slate-400">
              <span className="text-slate-600">-- database guarantee</span>
              <br />
              <span className="text-gold-300">unique_active_show_seat</span>
              <br />
              <span className="text-slate-500">ON</span> tickets (show_id, seat_id)
              <br />
              <span className="text-slate-500">WHERE</span> ticket_status ={' '}
              <span className="text-emerald-300">&apos;Booked&apos;</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1 text-emerald-200">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Winner gets 201 Created
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/20 bg-rose-400/[0.07] px-2.5 py-1 text-rose-200">
                <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                Loser gets 409 Conflict
              </span>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
              Want a wider window? Set{' '}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-gold-200/80">
                BOOKING_DELAY_MS=1500
              </code>{' '}
              before starting the backend.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <div
                key={title}
                className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400/10 text-gold-300">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[10px] text-slate-600">0{index + 1}</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-100">{title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
