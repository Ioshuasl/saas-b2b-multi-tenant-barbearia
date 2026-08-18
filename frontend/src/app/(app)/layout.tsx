import type { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-white/10 px-6 py-3 text-sm opacity-80">Painel</header>
      {children}
    </div>
  );
}
