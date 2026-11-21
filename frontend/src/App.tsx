import { Armchair, CalendarX2, Film } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, api, messageFromError } from './api';
import { BookingSummary } from './components/BookingSummary';
import { ConcurrencyNote } from './components/ConcurrencyNote';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MovieGrid } from './components/MovieGrid';
import { SeatMap } from './components/SeatMap';
import { SectionHeader } from './components/SectionHeader';
import { ShowList } from './components/ShowList';
import {
  EmptyState,
  ErrorState,
  MovieGridSkeleton,
  SeatMapSkeleton,
  ShowGridSkeleton,
} from './components/States';
import { ToastStack } from './components/ToastStack';
import { formatDuration, formatShowDate, formatShowTime } from './format';
import { useToasts } from './hooks/useToasts';
import type {
  Booking,
  Movie,
  Moviegoer,
  Seat,
  Show,
  ShowSeatsResponse,
} from './types';

const SEAT_POLL_INTERVAL_MS = 2000;
const CONFLICT_MESSAGE = 'Sorry, this seat was just booked by someone else.';

function scrollToSection(id: string): void {
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 120);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [moviesError, setMoviesError] = useState<string | null>(null);
  const [moviesVersion, setMoviesVersion] = useState(0);

  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [showsLoading, setShowsLoading] = useState(false);
  const [showsError, setShowsError] = useState<string | null>(null);
  const [showsVersion, setShowsVersion] = useState(0);

  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);
  const [seatData, setSeatData] = useState<ShowSeatsResponse | null>(null);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [seatsError, setSeatsError] = useState<string | null>(null);
  const [seatsVersion, setSeatsVersion] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [liveError, setLiveError] = useState(false);

  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);

  const [moviegoers, setMoviegoers] = useState<Moviegoer[]>([]);
  const [moviegoersLoading, setMoviegoersLoading] = useState(true);
  const [moviegoersError, setMoviegoersError] = useState<string | null>(null);
  const [moviegoersVersion, setMoviegoersVersion] = useState(0);
  const [selectedMoviegoerId, setSelectedMoviegoerId] = useState<number | null>(null);

  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Booking | null>(null);

  const { toasts, pushToast, dismissToast } = useToasts();

  const selectedSeatRef = useRef<number | null>(null);
  const seatsDataRef = useRef<ShowSeatsResponse | null>(null);
  const bookingRef = useRef(false);

  const selectedMovie = useMemo(
    () => movies.find((movie) => movie.movie_id === selectedMovieId) ?? null,
    [movies, selectedMovieId],
  );

  const selectedShow = useMemo(
    () => shows.find((show) => show.show_id === selectedShowId) ?? null,
    [shows, selectedShowId],
  );

  const selectedSeat = useMemo(
    () => seatData?.seats.find((seat) => seat.seat_id === selectedSeatId) ?? null,
    [seatData, selectedSeatId],
  );

  useEffect(() => {
    const controller = new AbortController();
    setMoviesLoading(true);
    setMoviesError(null);

    api
      .getMovies(controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setMovies(response.movies);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setMoviesError(messageFromError(error, 'Unable to load the movie catalogue.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setMoviesLoading(false);
        }
      });

    return () => controller.abort();
  }, [moviesVersion]);

  useEffect(() => {
    const controller = new AbortController();
    setMoviegoersLoading(true);
    setMoviegoersError(null);

    api
      .getMoviegoers(controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setMoviegoers(response.moviegoers);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setMoviegoersError(messageFromError(error, 'Unable to load customers.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setMoviegoersLoading(false);
        }
      });

    return () => controller.abort();
  }, [moviegoersVersion]);

  useEffect(() => {
    if (selectedMovieId === null) {
      setShows([]);
      setShowsLoading(false);
      setShowsError(null);
      return;
    }

    const controller = new AbortController();
    setShowsLoading(true);
    setShowsError(null);

    api
      .getShows(selectedMovieId, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setShows(response.shows);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setShowsError(messageFromError(error, 'Unable to load showtimes.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setShowsLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedMovieId, showsVersion]);

  useEffect(() => {
    if (selectedShowId === null) {
      seatsDataRef.current = null;
      setSeatData(null);
      setSeatsLoading(false);
      setSeatsError(null);
      setLiveError(false);
      return;
    }

    const controller = new AbortController();
    let stopped = false;
    let inFlight = false;

    if (!seatsDataRef.current) {
      setSeatsLoading(true);
    }
    setSeatsError(null);

    const loadSeats = async (): Promise<void> => {
      if (inFlight || stopped) {
        return;
      }
      inFlight = true;

      try {
        const response = await api.getShowSeats(selectedShowId, controller.signal);
        if (stopped) {
          return;
        }

        seatsDataRef.current = response;
        setSeatData(response);
        setSeatsLoading(false);
        setSeatsError(null);
        setLiveError(false);
        setLastSyncedAt(Date.now());

        const currentSelection = selectedSeatRef.current;
        if (currentSelection !== null && !bookingRef.current) {
          const seat = response.seats.find((item) => item.seat_id === currentSelection);
          if (!seat || seat.is_booked) {
            selectedSeatRef.current = null;
            setSelectedSeatId(null);
            if (seat?.is_booked) {
              pushToast(`Seat ${seat.seat_number} was just booked by someone else.`, 'error');
            }
          }
        }
      } catch (error) {
        if (stopped || isAbortError(error)) {
          return;
        }

        if (!seatsDataRef.current) {
          setSeatsError(messageFromError(error, 'Unable to load seat availability.'));
          setSeatsLoading(false);
        } else {
          setLiveError(true);
        }
      } finally {
        inFlight = false;
      }
    };

    void loadSeats();
    const interval = window.setInterval(() => {
      void loadSeats();
    }, SEAT_POLL_INTERVAL_MS);

    return () => {
      stopped = true;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [selectedShowId, seatsVersion, pushToast]);

  const clearSelectedSeat = useCallback(() => {
    selectedSeatRef.current = null;
    setSelectedSeatId(null);
  }, []);

  const resetSeatPanel = useCallback(() => {
    seatsDataRef.current = null;
    setSeatData(null);
    setSeatsLoading(false);
    setSeatsError(null);
    setLiveError(false);
    setLastSyncedAt(null);
    clearSelectedSeat();
    setBookingError(null);
  }, [clearSelectedSeat]);

  const handleSelectMovie = useCallback(
    (movieId: number) => {
      if (movieId === selectedMovieId) {
        scrollToSection('showtimes');
        return;
      }

      setSelectedMovieId(movieId);
      setSelectedShowId(null);
      setShows([]);
      setShowsError(null);
      resetSeatPanel();
      scrollToSection('showtimes');
    },
    [selectedMovieId, resetSeatPanel],
  );

  const handleSelectShow = useCallback(
    (show: Show) => {
      if (show.show_id === selectedShowId) {
        scrollToSection('seats');
        return;
      }

      setSelectedShowId(show.show_id);
      resetSeatPanel();
      setSeatsLoading(true);
      scrollToSection('seats');
    },
    [selectedShowId, resetSeatPanel],
  );

  const handleSelectSeat = useCallback(
    (seat: Seat) => {
      if (seat.is_booked || booking) {
        return;
      }

      const next = selectedSeatRef.current === seat.seat_id ? null : seat.seat_id;
      selectedSeatRef.current = next;
      setSelectedSeatId(next);
      setBookingError(null);
    },
    [booking],
  );

  const handleBook = async (): Promise<void> => {
    if (
      bookingRef.current ||
      selectedShowId === null ||
      selectedSeatId === null ||
      selectedMoviegoerId === null ||
      booking
    ) {
      return;
    }

    const showId = selectedShowId;
    const seatId = selectedSeatId;
    const moviegoerId = selectedMoviegoerId;
    const seat = seatData?.seats.find((item) => item.seat_id === seatId) ?? null;

    bookingRef.current = true;
    setBooking(true);
    setBookingError(null);

    try {
      const response = await api.createBooking({
        show_id: showId,
        seat_id: seatId,
        moviegoer_id: moviegoerId,
      });

      clearSelectedSeat();
      setConfirmation(response.booking);
      setSeatData((current) =>
        current && current.show.show_id === showId
          ? {
              ...current,
              seats: current.seats.map((item) =>
                item.seat_id === response.booking.seat_id ? { ...item, is_booked: true } : item,
              ),
            }
          : current,
      );
      setShows((current) =>
        current.map((show) =>
          show.show_id === response.booking.show_id
            ? { ...show, available_seats: Math.max(0, show.available_seats - 1) }
            : show,
        ),
      );
      setSeatsVersion((version) => version + 1);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const message = error.message || CONFLICT_MESSAGE;
        setBookingError(message);
        pushToast('That seat was taken while you were booking. Choose another seat.', 'error');
        clearSelectedSeat();
        if (seat) {
          setSeatData((current) =>
            current && current.show.show_id === showId
              ? {
                  ...current,
                  seats: current.seats.map((item) =>
                    item.seat_id === seat.seat_id ? { ...item, is_booked: true } : item,
                  ),
                }
              : current,
          );
        }
        setSeatsVersion((version) => version + 1);
      } else {
        const message = messageFromError(error, 'Booking failed. Please try again.');
        setBookingError(message);
        pushToast(message, 'error');
      }
    } finally {
      bookingRef.current = false;
      setBooking(false);
    }
  };

  const handleCloseConfirmation = useCallback(() => {
    setConfirmation(null);
    scrollToSection('seats');
  }, []);

  const showForBooking = seatData?.show ?? null;

  return (
    <div id="top" className="min-h-screen">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <Hero movieCount={moviesLoading && movies.length === 0 ? null : movies.length} />

        <section id="movies" className="scroll-mt-24 pt-12 sm:pt-16">
          <SectionHeader
            step="01"
            title="Choose a film"
            description="Every film currently on the marquee. Pick one to see where and when it is playing."
          />

          {moviesLoading ? (
            <MovieGridSkeleton />
          ) : moviesError ? (
            <ErrorState
              title="The marquee is unavailable"
              message={moviesError}
              onRetry={() => setMoviesVersion((version) => version + 1)}
            />
          ) : movies.length === 0 ? (
            <EmptyState
              title="No films in the catalogue"
              message="The movies table is empty. Add a movie to the database and try again."
              icon={<Film className="h-5 w-5" aria-hidden="true" />}
            />
          ) : (
            <MovieGrid
              movies={movies}
              selectedMovieId={selectedMovieId}
              onSelect={handleSelectMovie}
            />
          )}
        </section>

        {selectedMovie && (
          <section id="showtimes" className="animate-fade-up scroll-mt-24 pt-14 sm:pt-20">
            <SectionHeader
              step="02"
              title="Pick a showtime"
              description={`${selectedMovie.movie_title} · ${selectedMovie.genre ?? 'Feature'} · ${formatDuration(
                selectedMovie.duration_minutes,
              )}. Choose a theatre, date and screen.`}
            />

            {showsLoading ? (
              <ShowGridSkeleton />
            ) : showsError ? (
              <ErrorState
                title="Showtimes could not load"
                message={showsError}
                onRetry={() => setShowsVersion((version) => version + 1)}
              />
            ) : shows.length === 0 ? (
              <EmptyState
                title="No shows scheduled"
                message="This film has no showtimes in the database yet. Pick another movie."
                icon={<CalendarX2 className="h-5 w-5" aria-hidden="true" />}
              />
            ) : (
              <ShowList shows={shows} selectedShowId={selectedShowId} onSelect={handleSelectShow} />
            )}
          </section>
        )}

        {selectedShowId !== null && (
          <section id="seats" className="animate-fade-up scroll-mt-24 pt-14 sm:pt-20">
            <SectionHeader
              step="03"
              title="Choose your seat"
              description={
                showForBooking
                  ? `${formatShowDate(showForBooking.show_date)} at ${formatShowTime(
                      showForBooking.start_time,
                    )} · ${showForBooking.theatre_name}, ${showForBooking.city}. Availability refreshes every 2 seconds.`
                  : 'Pick a seat from the live layout. Availability refreshes every 2 seconds.'
              }
            />

            {seatsLoading && !seatData ? (
              <SeatMapSkeleton />
            ) : seatsError ? (
              <ErrorState
                title="Seat availability is unavailable"
                message={seatsError}
                onRetry={() => setSeatsVersion((version) => version + 1)}
              />
            ) : seatData && showForBooking ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_384px]">
                <SeatMap
                  show={showForBooking}
                  seats={seatData.seats}
                  selectedSeatId={selectedSeatId}
                  onSelectSeat={handleSelectSeat}
                  liveError={liveError}
                  lastSyncedAt={lastSyncedAt}
                />
                <BookingSummary
                  show={showForBooking}
                  selectedSeat={selectedSeat}
                  moviegoers={moviegoers}
                  moviegoersLoading={moviegoersLoading}
                  moviegoersError={moviegoersError}
                  onRetryMoviegoers={() => setMoviegoersVersion((version) => version + 1)}
                  selectedMoviegoerId={selectedMoviegoerId}
                  onSelectMoviegoer={setSelectedMoviegoerId}
                  booking={booking}
                  bookingError={bookingError}
                  onBook={handleBook}
                />
              </div>
            ) : selectedShow && !seatsLoading ? (
              <EmptyState
                title="Choose a seat"
                message="Seat records for this screen are not available."
                icon={<Armchair className="h-5 w-5" aria-hidden="true" />}
              />
            ) : null}
          </section>
        )}

        <ConcurrencyNote />
      </main>

      <Footer />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {confirmation && (
        <ConfirmationModal booking={confirmation} onClose={handleCloseConfirmation} />
      )}
    </div>
  );
}
