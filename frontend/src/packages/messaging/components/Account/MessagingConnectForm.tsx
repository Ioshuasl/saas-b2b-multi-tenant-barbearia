'use client';

import { useMessagingAccountFormHook } from '@/packages/messaging/hooks/Account/useMessagingAccountFormHook';
import type { MessagingConnectFormProps } from '@/packages/messaging/types/Account/MessagingConnectFormTypes';
import type { MessagingAccountFormValues } from '@/packages/messaging/types/Account/MessagingAccountTypes';
import { Button } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';

export function MessagingConnectForm({ pending, error, onConnect }: MessagingConnectFormProps) {
  const form = useMessagingAccountFormHook();

  async function onSave(values: MessagingAccountFormValues) {
    await onConnect(values);
  }

  return (
    <form className="flex max-w-xl flex-col gap-4" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          {...form.register('riskAccepted')}
        />
        <span>
          Estou ciente de que este canal não é o aplicativo oficial da Meta. Vou usar um número
          dedicado (não o comercial da barbearia) e aceito o risco de bloqueio do número.
        </span>
      </label>
      {form.formState.errors.riskAccepted ? (
        <p className="text-xs text-red-300">{form.formState.errors.riskAccepted.message}</p>
      ) : null}
      {error ? <p className="text-sm text-red-300">{apiErrorMessage(error)}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Iniciando…' : 'Conectar número'}
      </Button>
    </form>
  );
}
