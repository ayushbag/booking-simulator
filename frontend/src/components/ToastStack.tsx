import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect } from 'react';
import type { ToastItem, ToastTone } from '../hooks/useToasts';

const TONE_STYLES: Record<ToastTone, string> = {
  error: 'border-rose-400/30 bg-rose-950/95 text-rose-50 shadow-rose-950/50',
  success: 'border-emerald-400/30 bg-emerald-950/95 text-emerald-50 shadow-emerald-950/50',
  info: 'border-gold-400/25 bg-ink-850/95 text-slate-100 shadow-black/50',
};

const TONE_ICONS: Record<ToastTone, typeof Info> = {
  error: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const TONE_ICON_STYLES: Record<ToastTone, string> = {
  error: 'text-rose-300',
  success: 'text-emerald-300',
  info: 'text-gold-300',
};

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  const Icon = TONE_ICONS[toast.tone];

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), 5200);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={`animate-toast-in flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-2xl backdrop-blur-xl ${TONE_STYLES[toast.tone]}`}
    >
      <Icon className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${TONE_ICON_STYLES[toast.tone]}`} aria-hidden="true" />
      <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-lg p-1 text-current/60 transition hover:bg-white/10 hover:text-current"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px]">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
