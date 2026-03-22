'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastCallback: ((toast: Toast) => void) | null = null;

export function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const id = Math.random().toString(36).substring(7);
  if (toastCallback) {
    toastCallback({ id, message, type });
  }
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  React.useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => onRemove(t.id), 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onRemove]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'animate-slide-in-right rounded-lg px-4 py-3 shadow-lg',
            'flex items-center gap-3 min-w-[300px]',
            t.type === 'success' && 'bg-green-600 text-white',
            t.type === 'error' && 'bg-red-600 text-white',
            t.type === 'info' && 'bg-blue-600 text-white'
          )}
        >
          {t.type === 'success' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {t.type === 'error' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {t.type === 'info' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="flex-1 text-sm font-medium">{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="opacity-70 hover:opacity-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    toastCallback = (toast) => {
      setToasts((prev) => [...prev, toast]);
    };
    return () => {
      toastCallback = null;
    };
  }, []);

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}
