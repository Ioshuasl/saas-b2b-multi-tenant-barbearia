'use client';

import { useEffect } from 'react';
import {
  serviceFormValues,
  useServiceFormHook,
} from '@/packages/admin/hooks/Service/useServiceFormHook';
import { useServiceCreateHook } from '@/packages/admin/hooks/Service/useServiceCreateHook';
import { useServiceUpdateHook } from '@/packages/admin/hooks/Service/useServiceUpdateHook';
import type { ServiceFormDialogProps } from '@/packages/admin/types/Service/ServiceFormDialogTypes';
import type { ServiceFormValues } from '@/packages/admin/types/Service/ServiceTypes';
import { Dialog } from '@/shared/ui/Dialog';
import { Button, Field, Input } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';

export function ServiceFormDialog({ service, onClose }: ServiceFormDialogProps) {
  const form = useServiceFormHook(service);
  const create = useServiceCreateHook();
  const update = useServiceUpdateHook();
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  function handleForm() {
    form.reset(serviceFormValues(service));
  }

  useEffect(() => {
    handleForm();
    // reset quando o registro muda
  }, [service]);

  async function onSave(values: ServiceFormValues) {
    if (service) await update.mutateAsync({ id: service.id, values });
    else await create.mutateAsync(values);
    onClose();
  }

  return (
    <Dialog title={service ? 'Editar serviço' : 'Novo serviço'} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
        <Field label="Nome" error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} />
        </Field>
        <Field label="Descrição" error={form.formState.errors.description?.message}>
          <Input {...form.register('description')} />
        </Field>
        <Field label="Duração (min)" error={form.formState.errors.durationMinutes?.message}>
          <Input type="number" {...form.register('durationMinutes')} />
        </Field>
        <Field label="Buffer (min)" error={form.formState.errors.bufferMinutes?.message}>
          <Input type="number" {...form.register('bufferMinutes')} />
        </Field>
        <Field label="Preço (R$)" error={form.formState.errors.priceReais?.message}>
          <Input type="number" step="0.01" {...form.register('priceReais')} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('visibleOnline')} /> Visível no agendamento
        </label>
        {service ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('active')} /> Ativo
          </label>
        ) : null}
        {error ? <p className="text-sm text-red-300">{apiErrorMessage(error)}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>
    </Dialog>
  );
}
