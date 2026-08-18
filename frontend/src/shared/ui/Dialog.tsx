'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!node.open) node.showModal();
    function onCancel(event: Event) {
      event.preventDefault();
      onClose();
    }
    node.addEventListener('cancel', onCancel);
    return () => node.removeEventListener('cancel', onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0f1115] p-5 text-[var(--foreground)] backdrop:bg-black/60"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button type="button" className="text-sm opacity-70" onClick={onClose}>
          Fechar
        </button>
      </div>
      {children}
    </dialog>
  );
}
