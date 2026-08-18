'use client';

import { useAuthForgotFormHook } from '@/packages/public/hooks/Auth/useAuthForgotFormHook';
import { useAuthForgotHook } from '@/packages/public/hooks/Auth/useAuthForgotHook';
import { AuthScreen } from '@/packages/public/components/Auth/AuthScreen';
import { Button, Field, Input } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';
import type { AuthForgotValues } from '@/packages/public/types/Auth/AuthTypes';

export function ForgotPasswordForm() {
  const form = useAuthForgotFormHook();
  const forgot = useAuthForgotHook();

  async function onSave(values: AuthForgotValues) {
    await forgot.mutateAsync(values);
  }

  return (
    <AuthScreen
      title="Recuperar senha"
      description="Se o e-mail existir, enviamos o link. A mensagem é a mesma nos dois casos."
    >
      {forgot.isSuccess ? (
        <p className="text-sm">Se o e-mail estiver cadastrado, o link já foi enviado.</p>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
          <Field label="E-mail" error={form.formState.errors.email?.message}>
            <Input type="email" autoComplete="email" {...form.register('email')} />
          </Field>
          {forgot.isError ? (
            <p className="text-sm text-red-300">{apiErrorMessage(forgot.error)}</p>
          ) : null}
          <Button type="submit" disabled={forgot.isPending}>
            {forgot.isPending ? 'Enviando…' : 'Enviar link'}
          </Button>
        </form>
      )}
    </AuthScreen>
  );
}
