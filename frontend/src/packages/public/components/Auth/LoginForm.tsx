'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthLoginFormHook } from '@/packages/public/hooks/Auth/useAuthLoginFormHook';
import { useAuthLoginHook } from '@/packages/public/hooks/Auth/useAuthLoginHook';
import { useHealthGetHook } from '@/packages/public/hooks/Health/useHealthGetHook';
import { AuthScreen } from '@/packages/public/components/Auth/AuthScreen';
import { Button, Field, Input } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';
import type { AuthLoginValues } from '@/packages/public/types/Auth/AuthTypes';

export function LoginForm() {
  const form = useAuthLoginFormHook();
  const login = useAuthLoginHook();
  const health = useHealthGetHook();
  const router = useRouter();

  async function onSave(values: AuthLoginValues) {
    try {
      await login.mutateAsync(values);
      router.push('/');
    } catch {
      /* erro no mutation */
    }
  }

  return (
    <AuthScreen
      title="Entrar"
      description="Acesse o painel da sua barbearia."
      footer={
        <div className="flex flex-col gap-2 text-sm opacity-80">
          <Link className="underline" href="/forgot-password">
            Esqueci a senha
          </Link>
          <Link className="underline" href="/signup">
            Criar conta da barbearia
          </Link>
          <p className="text-xs opacity-60">
            API:{' '}
            {health.isLoading ? 'verificando…' : health.isSuccess ? 'ok' : 'indisponível'}
          </p>
        </div>
      }
    >
      <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="username" {...form.register('email')} />
        </Field>
        <Field label="Senha" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...form.register('password')} />
        </Field>
        {login.isError ? <p className="text-sm text-red-300">{apiErrorMessage(login.error)}</p> : null}
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthScreen>
  );
}
