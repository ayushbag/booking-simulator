import { useCallback, useRef, useState } from 'react';

export type ToastTone = 'error' | 'success' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const pushToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [...current, { id, message, tone }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, pushToast, dismissToast };
}
