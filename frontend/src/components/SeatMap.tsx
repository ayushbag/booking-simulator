import {
  Armchair,
  Check,
  Clock3,
  MapPin,
  MonitorPlay,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useMemo } from 'react';
import {
  formatDuration,
  formatPrice,
  formatShowDate,
  formatShowTime,
  pluralize,
  seatColumn,
  seatRow,
} from '../format';
import type { Seat, ShowDetail } from '../types';

interface SeatMapProps {
  show: ShowDetail;
  seats: Seat[];
  selectedSeatId: number | null;
  onSelectSeat: (seat: Seat) => void;
  liveError: boolean;
  lastSyncedAt: number | null;
}

function syncedLabel(timestamp: number | null): string {
  if (!timestamp) {
    return 'Waiting for first sync';
  }

  return `Synced ${new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))}`;
}

export function SeatMap({
  show,
  seats,
  selectedSeatId,
  onSelectSeat,
  liveError,
  lastSyncedAt,
}: SeatMapProps) {
  const rows = useMemo(() => {
    const grouped = new Map<string, Seat[]>();

    for (const seat of seats) {
      const row = seatRow(seat.seat_number);
      const existing = grouped.get(row);
      if (existing) {
        existing.push(seat);
      } else {
        grouped.set(row, [seat]);
      }
    }

    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([row, rowSeats]) => ({
        row,
        seats: [...rowSeats].sort((a, b) => seatColumn(a.seat_number) - seatColumn(b.seat_number)),
      }));
  }, [seats]);

  const seatTypes = useMemo(() => {
    const types = new Map<string, number>();
    for (const seat of seats) {
      const type = seat.seat_type ?? 'Standard';
      if (!types.has(type)) {
        types.set(type, seat.ticket_price);
      }
    }
    return [...types.entries()];
  }, [seats]);

  const availableCount = seats.filter((seat) => !seat.is_booked).length;

  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-white/8 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Screen {show.screen_no}</p>
            <h3 className="mt-1 font-display text-2xl leading-tight font-semibold text-white sm:text-[1.7rem]">
              {show.movie_title}
            </h3>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gold-300/80" aria-hidden="true" />
                {show.theatre_name}, {show.city}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-gold-300/80" aria-hidden="true" />
                {formatShowDate(show.show_date)} · {formatShowTime(show.start_time)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MonitorPlay className="h-3.5 w-3.5 text-gold-300/80" aria-hidden="true" />
                {formatDuration(show.duration_minutes)}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${
                liveError
                  ? 'border-rose-400/25 bg-rose-400/10 text-rose-200'
                  : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
              }`}
            >
              {liveError ? (
                <WifiOff className="h-3 w-3" aria-hidden="true" />
              ) : (
                <>
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                  </span>
                  <Wifi className="h-3 w-3" aria-hidden="true" />
                </>
              )}
              {liveError ? 'Reconnecting' : 'Live seats'}
            </span>
            <span className="text-[10px] text-slate-500">
              {liveError ? 'Showing last known layout' : syncedLabel(lastSyncedAt)}
            </span>
          </div>
        </div>

        {liveError && (
          <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-100/80">
            Live updates are interrupted. The layout will refresh automatically when the backend is
            reachable again.
          </p>
        )}
      </div>

      <div className="p-5 sm:p-7">
        <div className="mx-auto max-w-lg">
          <div className="screen-arc" aria-hidden="true" />
          <p className="mt-2 text-center text-[9px] font-semibold tracking-[0.42em] text-gold-200/50 uppercase">
            Screen
          </p>
        </div>

        {seats.length === 0 ? (
          <div className="mx-auto mt-10 flex max-w-sm flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-9 text-center">
            <Armchair className="mb-3 h-6 w-6 text-slate-500" aria-hidden="true" />
            <p className="font-medium text-slate-300">No seats configured</p>
            <p className="mt-1 text-xs text-slate-500">
              This screen has no seat records in the database yet.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-9 overflow-x-auto pb-2">
              <div className="mx-auto flex w-max flex-col gap-2.5">
                {rows.map(({ row, seats: rowSeats }) => (
                  <div key={row} className="flex items-center gap-2 sm:gap-3">
                    <span className="w-4 text-center text-[10px] font-medium text-slate-600">
                      {row}
                    </span>
                    <div className="flex gap-1.5 sm:gap-2">
                      {rowSeats.map((seat) => {
                        const selected = seat.seat_id === selectedSeatId;
                        const label = `${seat.seat_number} · ${seat.seat_type ?? 'Standard'} · ${formatPrice(seat.ticket_price)}`;

                        return (
                          <button
                            key={seat.seat_id}
                            type="button"
                            disabled={seat.is_booked}
                            onClick={() => onSelectSeat(seat)}
                            aria-pressed={selected}
                            aria-label={`Seat ${label}${seat.is_booked ? ', booked' : selected ? ', selected' : ', available'}`}
                            title={`${label}${seat.is_booked ? ' (booked)' : ''}`}
                            className={`seat-chip ${
                              seat.is_booked
                                ? 'seat-booked'
                                : selected
                                  ? 'seat-selected'
                                  : 'seat-available'
                            }`}
                          >
                            {seat.seat_number}
                            {selected && (
                              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-ink-950 bg-gold-200 text-ink-950">
                                <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden="true" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <span className="w-4 text-center text-[10px] font-medium text-slate-600">
                      {row}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-5 text-center text-[11px] text-slate-500">
              {availableCount === 0
                ? 'Every seat for this show is booked.'
                : `${pluralize(availableCount, 'seat')} available · select one seat for this booking`}
            </p>

            {availableCount === 0 && (
              <p className="mx-auto mt-3 max-w-sm rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-center text-xs text-rose-100/80">
                This show is sold out. Try another showtime.
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/8 pt-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-[4px] border border-slate-600/70 bg-slate-800/70" />
                  Available
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-[4px] border border-gold-200 bg-gold-400" />
                  Selected
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-[4px] border border-slate-800 bg-slate-900/70" />
                  Booked
                </span>
              </div>

              {seatTypes.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-slate-500">
                  {seatTypes.map(([type, price]) => (
                    <span key={type} className="inline-flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-gold-300/70" aria-hidden="true" />
                      {type} · {formatPrice(price)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
