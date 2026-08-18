'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthResetFormHook } from '@/packages/public/hooks/Auth/useAuthResetFormHook';
import { useAuthResetHook } from '@/packages/public/hooks/Auth/useAuthResetHook';
import { AuthScreen } from '@/packages/public/components/Auth/AuthScreen';
import { Button, Field, Input } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';
import type { AuthResetValues } from '@/packages/public/types/Auth/AuthTypes';

export function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const form = useAuthResetFormHook(token);
  const reset = useAuthResetHook();

  async function onSave(values: AuthResetValues) {
    await reset.mutateAsync({ ...values, token });
  }

  if (!token) {
    return (
      <AuthScreen title="Link inválido" description="Abra o link completo enviado no e-mail." />
    );
  }

  return (
    <AuthScreen title="Nova senha" description="Defina uma senha com no mínimo 10 caracteres.">
      {reset.isSuccess ? (
        <p className="text-sm">
          Senha atualizada.{' '}
          <Link className="underline" href="/login">
            Entrar
          </Link>
        </p>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
          <Field label="Nova senha" error={form.formState.errors.password?.message}>
            <Input type="password" autoComplete="new-password" {...form.register('password')} />
          </Field>
          {reset.isError ? (
            <p className="text-sm text-red-300">{apiErrorMessage(reset.error)}</p>
          ) : null}
          <Button type="submit" disabled={reset.isPending}>
            {reset.isPending ? 'Salvando…' : 'Salvar senha'}
          </Button>
        </form>
      )}
    </AuthScreen>
  );
}
