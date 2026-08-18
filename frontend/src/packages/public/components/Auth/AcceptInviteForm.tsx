'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthAcceptInviteFormHook } from '@/packages/public/hooks/Auth/useAuthAcceptInviteFormHook';
import { useAuthAcceptInviteHook } from '@/packages/public/hooks/Auth/useAuthAcceptInviteHook';
import { AuthScreen } from '@/packages/public/components/Auth/AuthScreen';
import { Button, Field, Input } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';
import type { AuthAcceptInviteValues } from '@/packages/public/types/Auth/AuthTypes';

export function AcceptInviteForm() {
  const token = useSearchParams().get('token') ?? '';
  const form = useAuthAcceptInviteFormHook(token);
  const accept = useAuthAcceptInviteHook();

  async function onSave(values: AuthAcceptInviteValues) {
    await accept.mutateAsync({ ...values, token });
  }

  if (!token) {
    return (
      <AuthScreen title="Convite inválido" description="Abra o link completo enviado no e-mail." />
    );
  }

  return (
    <AuthScreen title="Aceitar convite" description="Crie sua senha para entrar na equipe.">
      {accept.isSuccess ? (
        <p className="text-sm">
          Convite aceito.{' '}
          <Link className="underline" href="/login">
            Entrar
          </Link>
        </p>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
          <Field label="Seu nome" error={form.formState.errors.name?.message}>
            <Input autoComplete="name" {...form.register('name')} />
          </Field>
          <Field label="Senha" error={form.formState.errors.password?.message}>
            <Input type="password" autoComplete="new-password" {...form.register('password')} />
          </Field>
          {accept.isError ? (
            <p className="text-sm text-red-300">{apiErrorMessage(accept.error)}</p>
          ) : null}
          <Button type="submit" disabled={accept.isPending}>
            {accept.isPending ? 'Enviando…' : 'Criar acesso'}
          </Button>
        </form>
      )}
    </AuthScreen>
  );
}
