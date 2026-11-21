import { Clock3, MapPin, MonitorPlay } from 'lucide-react';
import { formatShowDate, formatShowTime, pluralize } from '../format';
import type { Show } from '../types';

interface ShowListProps {
  shows: Show[];
  selectedShowId: number | null;
  onSelect: (show: Show) => void;
}

export function ShowList({ shows, selectedShowId, onSelect }: ShowListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {shows.map((show) => {
        const selected = show.show_id === selectedShowId;
        const soldOut = show.available_seats === 0;

        return (
          <button
            key={show.show_id}
            type="button"
            disabled={soldOut}
            onClick={() => onSelect(show)}
            aria-pressed={selected}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-200 sm:p-5 ${
              soldOut
                ? 'cursor-not-allowed border-white/6 bg-white/[0.02] opacity-55'
                : selected
                  ? 'border-gold-300/75 bg-gold-400/[0.07] shadow-[0_16px_50px_-24px_rgba(242,196,93,0.5)]'
                  : 'border-white/10 bg-ink-900/70 hover:-translate-y-0.5 hover:border-white/25 hover:bg-ink-850'
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-px ${
                selected ? 'bg-gradient-to-r from-transparent via-gold-300/80 to-transparent' : ''
              }`}
            />

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  {formatShowDate(show.show_date)}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
                  {formatShowTime(show.start_time)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                  soldOut
                    ? 'border-slate-700 text-slate-500'
                    : show.available_seats <= 2
                      ? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
                      : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                }`}
              >
                {soldOut ? 'Sold out' : `${pluralize(show.available_seats, 'seat')} left`}
              </span>
            </div>

            <div className="mt-4 space-y-2 border-t border-white/8 pt-4 text-xs text-slate-400">
              <p className="flex items-center gap-2 font-medium text-slate-200">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gold-300/80" aria-hidden="true" />
                <span className="truncate">{show.theatre_name}</span>
                <span className="font-normal text-slate-500">· {show.city}</span>
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatShowTime(show.start_time)} show
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MonitorPlay className="h-3.5 w-3.5" aria-hidden="true" />
                  Screen {show.screen_no}
                </span>
                <span className="truncate">{show.address ?? show.city}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
