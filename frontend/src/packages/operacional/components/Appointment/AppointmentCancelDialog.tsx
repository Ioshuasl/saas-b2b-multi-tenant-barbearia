'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppointmentDeleteHook } from '@/packages/operacional/hooks/Appointment/useAppointmentDeleteHook';
import type { AppointmentCancelDialogProps } from '@/packages/operacional/types/Appointment/AppointmentTypes';
import { Dialog } from '@/shared/ui/Dialog';
import { Button, Field, GhostButton, Textarea } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';

const cancelSchema = z.object({
  reason: z.string().min(2, 'Informe o motivo.').max(500),
});

type CancelValues = z.infer<typeof cancelSchema>;

export function AppointmentCancelDialog({
  appointmentId,
  onClose,
  onCancelled,
}: AppointmentCancelDialogProps) {
  const cancel = useAppointmentDeleteHook();
  const form = useForm<CancelValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: '' },
  });

  async function onSave(values: CancelValues) {
    await cancel.mutateAsync({ id: appointmentId, appointmentSchema: values });
    onCancelled();
    onClose();
  }

  return (
    <Dialog title="Cancelar agendamento" onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
        <Field label="Motivo" error={form.formState.errors.reason?.message}>
          <Textarea {...form.register('reason')} maxLength={500} />
        </Field>
        {cancel.isError ? (
          <p className="text-sm text-red-300">{apiErrorMessage(cancel.error)}</p>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={cancel.isPending}>
            {cancel.isPending ? 'Cancelando…' : 'Confirmar cancelamento'}
          </Button>
          <GhostButton type="button" onClick={onClose} disabled={cancel.isPending}>
            Voltar
          </GhostButton>
        </div>
      </form>
    </Dialog>
  );
}
