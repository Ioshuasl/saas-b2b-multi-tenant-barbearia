import type { ReactNode } from 'react';
import Link from 'next/link';

export function AuthScreen({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <p className="text-sm tracking-wide text-[var(--accent)]">Agenda</p>
        <h1 className="mt-1 text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm opacity-80">{description}</p>
      </div>
      {children}
      {footer ?? (
        <p className="text-sm opacity-70">
          <Link className="underline" href="/login">
            Voltar ao login
          </Link>
        </p>
      )}
    </main>
  );
}
