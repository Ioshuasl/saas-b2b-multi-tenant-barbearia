'use client';

import { useTimeBlockFormHook } from '@/packages/admin/hooks/TimeBlock/useTimeBlockFormHook';
import { useTimeBlockCreateHook } from '@/packages/admin/hooks/TimeBlock/useTimeBlockCreateHook';
import type { TimeBlockFormDialogProps } from '@/packages/admin/types/TimeBlock/TimeBlockFormDialogTypes';
import type { TimeBlockFormValues } from '@/packages/admin/types/TimeBlock/TimeBlockTypes';
import { Dialog } from '@/shared/ui/Dialog';
import { Button, Field, Input } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';

export function TimeBlockFormDialog({ locationId, onClose }: TimeBlockFormDialogProps) {
  const form = useTimeBlockFormHook();
  const create = useTimeBlockCreateHook();

  async function onSave(values: TimeBlockFormValues) {
    await create.mutateAsync({ locationId, values });
    onClose();
  }

  return (
    <Dialog title="Novo bloqueio" onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
        <Field label="Início" error={form.formState.errors.startsAt?.message}>
          <Input type="datetime-local" {...form.register('startsAt')} />
        </Field>
        <Field label="Fim" error={form.formState.errors.endsAt?.message}>
          <Input type="datetime-local" {...form.register('endsAt')} />
        </Field>
        <Field label="Motivo" error={form.formState.errors.reason?.message}>
          <Input {...form.register('reason')} />
        </Field>
        <Field label="RRULE (opcional)" error={form.formState.errors.rrule?.message}>
          <Input {...form.register('rrule')} placeholder="FREQ=WEEKLY;BYDAY=SA" />
        </Field>
        {create.isError ? <p className="text-sm text-red-300">{apiErrorMessage(create.error)}</p> : null}
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>
    </Dialog>
  );
}
