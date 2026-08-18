'use client';

import { useEffect } from 'react';

export function Toast({
  message,
  onClose,
  durationMs = 5000,
}: {
  message: string;
  onClose: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [onClose, durationMs]);

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-white/15 bg-[#1a1d24] px-4 py-3 text-sm shadow-lg"
    >
      {message}
    </div>
  );
}
