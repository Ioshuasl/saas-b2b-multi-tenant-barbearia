'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthVerifyHook } from '@/packages/public/hooks/Auth/useAuthVerifyHook';
import { AuthScreen } from '@/packages/public/components/Auth/AuthScreen';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';

export function VerifyEmailForm() {
  const token = useSearchParams().get('token') ?? '';
  const verify = useAuthVerifyHook();

  useEffect(() => {
    if (token) void verify.mutateAsync(token);
    // uma vez por token
    // uma vez por token
  }, [token]);

  if (!token) {
    return (
      <AuthScreen title="Link inválido" description="Abra o link completo enviado no e-mail." />
    );
  }

  return (
    <AuthScreen title="Confirmar e-mail" description="Validando o token do convite de verificação.">
      {verify.isPending ? <p className="text-sm">Confirmando…</p> : null}
      {verify.isSuccess ? (
        <p className="text-sm">
          E-mail confirmado.{' '}
          <Link className="underline" href="/login">
            Entrar
          </Link>
        </p>
      ) : null}
      {verify.isError ? <p className="text-sm text-red-300">{apiErrorMessage(verify.error)}</p> : null}
    </AuthScreen>
  );
}
