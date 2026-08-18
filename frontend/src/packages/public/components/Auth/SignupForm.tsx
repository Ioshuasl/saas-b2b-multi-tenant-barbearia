'use client';

import { useRouter } from 'next/navigation';
import { useAuthSignupFormHook } from '@/packages/public/hooks/Auth/useAuthSignupFormHook';
import { useAuthSignupHook } from '@/packages/public/hooks/Auth/useAuthSignupHook';
import { AuthScreen } from '@/packages/public/components/Auth/AuthScreen';
import { Button, Field, Input } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';
import type { AuthSignupValues } from '@/packages/public/types/Auth/AuthTypes';

export function SignupForm() {
  const form = useAuthSignupFormHook();
  const signup = useAuthSignupHook();
  const router = useRouter();

  async function onSave(values: AuthSignupValues) {
    try {
      await signup.mutateAsync(values);
      router.push('/');
    } catch {
      /* erro no mutation */
    }
  }

  return (
    <AuthScreen
      title="Criar barbearia"
      description="Cadastre a rede e o dono. Você entra já autenticado para concluir o início."
    >
      <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
        <Field label="Nome da barbearia" error={form.formState.errors.tenantName?.message}>
          <Input autoComplete="organization" {...form.register('tenantName')} />
        </Field>
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register('email')} />
        </Field>
        <Field label="Telefone" error={form.formState.errors.phone?.message}>
          <Input type="tel" autoComplete="tel" {...form.register('phone')} />
        </Field>
        <Field label="Senha" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...form.register('password')} />
        </Field>
        {signup.isError ? (
          <p className="text-sm text-red-300">{apiErrorMessage(signup.error)}</p>
        ) : null}
        <Button type="submit" disabled={signup.isPending}>
          {signup.isPending ? 'Criando…' : 'Criar e entrar'}
        </Button>
      </form>
    </AuthScreen>
  );
}
