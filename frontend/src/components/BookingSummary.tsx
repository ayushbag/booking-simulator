import {
  AlertTriangle,
  Armchair,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Ticket,
  UserRound,
} from 'lucide-react';
import { formatPrice, formatShowDate, formatShowTime, formatDuration } from '../format';
import type { Moviegoer, Seat, ShowDetail } from '../types';

interface BookingSummaryProps {
  show: ShowDetail;
  selectedSeat: Seat | null;
  moviegoers: Moviegoer[];
  moviegoersLoading: boolean;
  moviegoersError: string | null;
  onRetryMoviegoers: () => void;
  selectedMoviegoerId: number | null;
  onSelectMoviegoer: (moviegoerId: number) => void;
  booking: boolean;
  bookingError: string | null;
  onBook: () => void;
}

export function BookingSummary({
  show,
  selectedSeat,
  moviegoers,
  moviegoersLoading,
  moviegoersError,
  onRetryMoviegoers,
  selectedMoviegoerId,
  onSelectMoviegoer,
  booking,
  bookingError,
  onBook,
}: BookingSummaryProps) {
  const canBook =
    selectedSeat !== null &&
    selectedMoviegoerId !== null &&
    !booking &&
    !moviegoersLoading &&
    !moviegoersError;

  let buttonLabel = 'Confirm booking';
  if (booking) {
    buttonLabel = 'Booking seat…';
  } else if (!selectedSeat) {
    buttonLabel = 'Select a seat to continue';
  } else if (!selectedMoviegoerId) {
    buttonLabel = 'Choose a customer';
  }

  return (
    <aside className="surface self-start p-5 sm:p-6 lg:sticky lg:top-24">
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-gold-300" aria-hidden="true" />
        <p className="eyebrow">Your booking</p>
      </div>

      <h3 className="mt-3 font-display text-xl leading-tight font-semibold text-white">
        {show.movie_title}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
        {show.theatre_name}, {show.city} · Screen {show.screen_no}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5">
          <p className="text-[9px] font-semibold tracking-[0.15em] text-slate-500 uppercase">Date</p>
          <p className="mt-1 font-medium text-slate-200">{formatShowDate(show.show_date)}</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5">
          <p className="text-[9px] font-semibold tracking-[0.15em] text-slate-500 uppercase">Time</p>
          <p className="mt-1 font-medium text-slate-200">{formatShowTime(show.start_time)}</p>
        </div>
      </div>

      <div className="my-5 border-t border-dashed border-white/10" />

      <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">Seat</p>

      {selectedSeat ? (
        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-gold-400/25 bg-gold-400/[0.07] p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-400 text-sm font-bold text-ink-950">
            {selectedSeat.seat_number}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              {selectedSeat.seat_type ?? 'Standard'} seat
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Row {selectedSeat.seat_number.replace(/\d+$/, '')} · {formatDuration(show.duration_minutes)}{' '}
              runtime
            </p>
          </div>
          <p className="text-sm font-semibold text-gold-200">{formatPrice(selectedSeat.ticket_price)}</p>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-500">
            <Armchair className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Pick an available seat from the layout to see its price here.
          </p>
        </div>
      )}

      <div className="mt-5">
        <label
          htmlFor="moviegoer-select"
          className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase"
        >
          <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          Customer
        </label>

        {moviegoersError ? (
          <div className="mt-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3">
            <p className="text-xs text-rose-100/80">{moviegoersError}</p>
            <button
              type="button"
              onClick={onRetryMoviegoers}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-200 hover:text-white"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : (
          <div className="relative mt-2">
            <select
              id="moviegoer-select"
              value={selectedMoviegoerId ?? ''}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (value > 0) {
                  onSelectMoviegoer(value);
                }
              }}
              disabled={moviegoersLoading || booking}
              className="w-full appearance-none rounded-xl border border-white/12 bg-ink-850 px-3.5 py-3 pr-9 text-sm text-slate-100 transition outline-none hover:border-white/20 focus:border-gold-400/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {moviegoersLoading ? 'Loading customers…' : 'Select a moviegoer'}
              </option>
              {moviegoers.map((moviegoer) => (
                <option key={moviegoer.moviegoer_id} value={moviegoer.moviegoer_id}>
                  {moviegoer.moviegoer_name}
                  {moviegoer.email ? ` — ${moviegoer.email}` : ''}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-500">
              ▾
            </span>
          </div>
        )}
      </div>

      {bookingError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-400/25 bg-rose-400/[0.08] p-3"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold text-rose-100">Booking not completed</p>
            <p className="mt-1 text-xs leading-relaxed text-rose-100/75">{bookingError}</p>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-end justify-between border-t border-white/8 pt-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">Total</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {selectedSeat ? formatPrice(selectedSeat.ticket_price) : '—'}
          </p>
        </div>
        <p className="pb-1 text-[10px] text-slate-500">Ticket price</p>
      </div>

      <button
        type="button"
        onClick={onBook}
        disabled={!canBook}
        aria-busy={booking}
        className={`mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
          canBook
            ? 'bg-gold-400 text-ink-950 shadow-[0_14px_38px_-16px_rgba(242,196,93,0.8)] hover:bg-gold-300 active:translate-y-px'
            : 'cursor-not-allowed border border-white/8 bg-white/[0.035] text-slate-500'
        }`}
      >
        {booking ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Ticket className="h-4 w-4" aria-hidden="true" />
        )}
        {buttonLabel}
      </button>

      <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-500">
        <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-400/70" aria-hidden="true" />
        Availability is verified by PostgreSQL at the moment of booking. Live checks can race, the
        database cannot.
      </p>
    </aside>
  );
}
