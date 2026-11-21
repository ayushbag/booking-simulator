import { AlertTriangle, Armchair, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
  compact?: boolean;
}

export function ErrorState({ title, message, onRetry, compact = false }: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-start gap-4 rounded-2xl border border-rose-400/20 bg-rose-950/20 ${
        compact ? 'p-4' : 'p-6 sm:p-8'
      }`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" aria-hidden="true" />
        <div>
          <h3 className="font-semibold text-rose-50">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-rose-100/70">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl border border-rose-300/25 bg-rose-300/10 px-3.5 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-300/20"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: ReactNode;
}

export function EmptyState({ title, message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
        {icon ?? <Armchair className="h-5 w-5" aria-hidden="true" />}
      </div>
      <h3 className="font-semibold text-slate-200">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">{message}</p>
    </div>
  );
}

export function MovieGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="surface animate-pulse overflow-hidden rounded-2xl">
          <div className="aspect-[3/4] bg-white/5" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-2/3 rounded bg-white/8" />
            <div className="h-2.5 w-1/2 rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShowGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="surface animate-pulse space-y-4 p-5">
          <div className="h-3 w-24 rounded bg-white/8" />
          <div className="h-7 w-32 rounded bg-white/10" />
          <div className="h-3 w-40 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

export function SeatMapSkeleton() {
  return (
    <div className="surface animate-pulse p-5 sm:p-7" aria-hidden="true">
      <div className="h-3 w-36 rounded bg-white/8" />
      <div className="mt-3 h-6 w-52 rounded bg-white/10" />
      <div className="mx-auto mt-10 h-10 w-3/4 rounded-t-full bg-white/5" />
      <div className="mx-auto mt-8 w-fit space-y-3">
        {[4, 4, 3].map((count, row) => (
          <div key={row} className="flex justify-center gap-2">
            {Array.from({ length: count }).map((_, seat) => (
              <div key={seat} className="h-11 w-11 rounded-xl bg-white/8 sm:h-12 sm:w-12" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
