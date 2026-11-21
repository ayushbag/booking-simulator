import { Check, ChevronRight, Film } from 'lucide-react';
import { formatDuration, initials, pluralize } from '../format';
import type { Movie } from '../types';

interface PosterPalette {
  background: string;
  accent: string;
}

const PALETTES: PosterPalette[] = [
  {
    background:
      'radial-gradient(circle at 22% 16%, rgba(129,140,248,0.52), transparent 52%), linear-gradient(155deg, #1b2444 0%, #0a0d17 72%)',
    accent: '#c7d2fe',
  },
  {
    background:
      'radial-gradient(circle at 78% 18%, rgba(251,113,133,0.45), transparent 50%), linear-gradient(155deg, #351927 0%, #0d0a11 72%)',
    accent: '#fecdd3',
  },
  {
    background:
      'radial-gradient(circle at 26% 22%, rgba(52,211,153,0.4), transparent 52%), linear-gradient(155deg, #12312b 0%, #080f0e 72%)',
    accent: '#a7f3d0',
  },
  {
    background:
      'radial-gradient(circle at 72% 20%, rgba(251,191,36,0.44), transparent 50%), linear-gradient(155deg, #35280f 0%, #100d08 72%)',
    accent: '#fde68a',
  },
  {
    background:
      'radial-gradient(circle at 30% 18%, rgba(56,189,248,0.42), transparent 52%), linear-gradient(155deg, #132c3b 0%, #080e13 72%)',
    accent: '#bae6fd',
  },
];

function paletteFor(movieId: number): PosterPalette {
  return PALETTES[(movieId - 1) % PALETTES.length]!;
}

interface MovieCardProps {
  movie: Movie;
  selected: boolean;
  onSelect: (movieId: number) => void;
}

function MovieCard({ movie, selected, onSelect }: MovieCardProps) {
  const palette = paletteFor(movie.movie_id);

  return (
    <button
      type="button"
      onClick={() => onSelect(movie.movie_id)}
      aria-pressed={selected}
      className={`group text-left transition duration-200 focus-visible:outline-offset-4 ${
        selected ? '-translate-y-1' : 'hover:-translate-y-1'
      }`}
    >
      <div
        className={`relative aspect-[3/4] overflow-hidden rounded-2xl border bg-ink-900 ${
          selected
            ? 'border-gold-300/80 shadow-[0_18px_55px_-20px_rgba(242,196,93,0.55)]'
            : 'border-white/10 shadow-[0_16px_40px_-24px_rgba(0,0,0,1)] group-hover:border-white/25'
        }`}
        style={{ backgroundImage: palette.background }}
      >
        <div className="film-grain pointer-events-none absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span
            className="rounded-full border border-white/15 bg-black/25 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md"
            style={{ color: palette.accent }}
          >
            {movie.genre ?? 'Feature'}
          </span>
          {selected && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-ink-950 shadow-lg">
              <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
            </span>
          )}
        </div>

        <span
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[76px] leading-none font-semibold tracking-tighter opacity-15"
          style={{ color: palette.accent }}
          aria-hidden="true"
        >
          {initials(movie.movie_title)}
        </span>

        <Film
          className="absolute top-[44%] left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 opacity-35"
          style={{ color: palette.accent }}
          strokeWidth={1.2}
          aria-hidden="true"
        />

        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <h3 className="font-display text-[1.35rem] leading-tight font-semibold text-white">
            {movie.movie_title}
          </h3>
          <p className="mt-1.5 text-[11px] font-medium text-white/60">
            {movie.language ?? 'Language TBA'} · {formatDuration(movie.duration_minutes)}
          </p>
        </div>
      </div>

      <div
        className={`mt-2.5 flex items-center justify-between rounded-xl px-1 text-[11px] font-medium transition ${
          selected ? 'text-gold-300' : 'text-slate-500 group-hover:text-slate-300'
        }`}
      >
        <span>{movie.show_count > 0 ? pluralize(movie.show_count, 'show') : 'No shows yet'}</span>
        <ChevronRight
          className={`h-3.5 w-3.5 transition-transform ${selected ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'}`}
          aria-hidden="true"
        />
      </div>
    </button>
  );
}

interface MovieGridProps {
  movies: Movie[];
  selectedMovieId: number | null;
  onSelect: (movieId: number) => void;
}

export function MovieGrid({ movies, selectedMovieId, onSelect }: MovieGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard
          key={movie.movie_id}
          movie={movie}
          selected={movie.movie_id === selectedMovieId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
