'use client';

import { useStaffInviteFormHook } from '@/packages/admin/hooks/Staff/useStaffFormHook';
import { useStaffInviteHook } from '@/packages/admin/hooks/Staff/useStaffInviteHook';
import type { StaffInviteFormDialogProps } from '@/packages/admin/types/Staff/StaffFormDialogTypes';
import type { StaffInviteValues } from '@/packages/admin/types/Staff/StaffFormDialogTypes';
import { Dialog } from '@/shared/ui/Dialog';
import { Button, Field, Input } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';

export function StaffInviteFormDialog({ staffId, onClose }: StaffInviteFormDialogProps) {
  const form = useStaffInviteFormHook();
  const invite = useStaffInviteHook();

  async function onSave(values: StaffInviteValues) {
    await invite.mutateAsync({ id: staffId, email: values.email });
    onClose();
  }

  return (
    <Dialog title="Convidar profissional" onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register('email')} />
        </Field>
        {invite.isError ? <p className="text-sm text-red-300">{apiErrorMessage(invite.error)}</p> : null}
        <Button type="submit" disabled={invite.isPending}>
          {invite.isPending ? 'Enviando…' : 'Enviar convite'}
        </Button>
      </form>
    </Dialog>
  );
}
