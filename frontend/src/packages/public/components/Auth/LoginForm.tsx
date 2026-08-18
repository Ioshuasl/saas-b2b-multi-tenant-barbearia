'use client';

import { useState, type FormEvent } from 'react';
import { useHealthGetHook } from '@/packages/public/hooks/Health/useHealthGetHook';

export function LoginForm() {
  const [notice, setNotice] = useState<string | null>(null);
  const health = useHealthGetHook();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('Login real entra na Sprint 1. Esta tela é só o mock da fundação.');
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <p className="text-sm tracking-wide text-[var(--accent)]">Sprint 0</p>
        <h1 className="mt-1 text-3xl font-semibold">Entrar</h1>
        <p className="mt-2 text-sm opacity-80">
          Painel da barbearia. Autenticação de verdade (e-mail/senha) chega na próxima sprint.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input
            type="email"
            name="email"
            autoComplete="username"
            className="rounded-md border border-white/15 bg-white/5 px-3 py-2"
            placeholder="dono@barbearia.com"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Senha
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            className="rounded-md border border-white/15 bg-white/5 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-md bg-[var(--accent)] px-3 py-2 font-medium text-black"
        >
          Entrar
        </button>
      </form>
      {notice ? <p className="text-sm text-[var(--accent)]">{notice}</p> : null}
      <p className="text-xs opacity-60">
        API:{' '}
        {health.isLoading
          ? 'verificando…'
          : health.isSuccess
            ? 'ok'
            : 'indisponível (subir `pnpm dev:api`)'}
      </p>
    </main>
  );
}
