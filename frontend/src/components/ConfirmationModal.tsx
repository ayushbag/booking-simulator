import {
  Armchair,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Ticket,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
  formatBookedAt,
  formatDuration,
  formatPrice,
  formatShowDateLong,
  formatShowTime,
} from '../format';
import type { Booking } from '../types';

interface ConfirmationModalProps {
  booking: Booking;
  onClose: () => void;
}

export function ConfirmationModal({ booking, onClose }: ConfirmationModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="animate-modal-in relative my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-white/12 bg-ink-900 shadow-[0_40px_120px_-30px_rgba(0,0,0,1)]">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-emerald-400/12 to-transparent" />

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Close confirmation"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="eyebrow mt-4 text-emerald-300">Booking confirmed</p>
            <h2
              id="confirmation-title"
              className="mt-1.5 font-display text-2xl font-semibold text-white sm:text-3xl"
            >
              Enjoy the show.
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Your seat is reserved. Booking #{booking.booking_id}
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-ink-850">
            <div className="border-b border-dashed border-white/10 p-4 sm:p-5">
              <p className="font-display text-xl leading-tight font-semibold text-white">
                {booking.movie_title}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {[booking.genre, booking.language, formatDuration(booking.duration_minutes)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>

              <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-300/80" aria-hidden="true" />
                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                      Theatre
                    </p>
                    <p className="mt-0.5 font-medium text-slate-200">{booking.theatre_name}</p>
                    <p className="text-slate-500">
                      {booking.city} · Screen {booking.screen_no}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CalendarDays
                    className="mt-0.5 h-4 w-4 shrink-0 text-gold-300/80"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                      Date & time
                    </p>
                    <p className="mt-0.5 font-medium text-slate-200">
                      {formatShowDateLong(booking.show_date)}
                    </p>
                    <p className="text-slate-500">{formatShowTime(booking.start_time)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/10">
              <div className="p-4 sm:p-5">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                  <Armchair className="h-3 w-3" aria-hidden="true" />
                  Seat
                </p>
                <p className="mt-1.5 text-lg font-semibold text-white">{booking.seat_number}</p>
                <p className="text-[11px] text-slate-500">{booking.seat_type ?? 'Standard'}</p>
              </div>
              <div className="p-4 sm:p-5">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                  <Ticket className="h-3 w-3" aria-hidden="true" />
                  Ticket price
                </p>
                <p className="mt-1.5 text-lg font-semibold text-gold-200">
                  {formatPrice(booking.ticket_price)}
                </p>
                <p className="text-[11px] text-slate-500">{booking.ticket_status ?? 'Booked'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-white/10 p-4 sm:grid-cols-2 sm:p-5">
              <div className="flex items-start gap-2.5">
                <UserRound
                  className="mt-0.5 h-4 w-4 shrink-0 text-gold-300/80"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                    Customer
                  </p>
                  <p className="mt-0.5 font-medium text-slate-200">{booking.moviegoer_name}</p>
                  {booking.email && <p className="truncate text-slate-500">{booking.email}</p>}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock3
                  className="mt-0.5 h-4 w-4 shrink-0 text-gold-300/80"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                    Booked at
                  </p>
                  <p className="mt-0.5 font-medium text-slate-200">
                    {formatBookedAt(booking.booked_at)}
                  </p>
                  <p className="text-slate-500">Confirmed transaction</p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-xl bg-gold-400 px-4 py-3.5 text-sm font-semibold text-ink-950 shadow-[0_14px_38px_-16px_rgba(242,196,93,0.8)] transition hover:bg-gold-300 active:translate-y-px"
          >
            Book another seat
          </button>
        </div>
      </div>
    </div>
  );
}
