'use client';

import { useInvitationFormHook } from '@/packages/admin/hooks/Invitation/useInvitationFormHook';
import { useInvitationCreateHook } from '@/packages/admin/hooks/Invitation/useInvitationCreateHook';
import { useLocationListHook } from '@/packages/admin/hooks/Location/useLocationListHook';
import { USER_ROLES, USER_ROLE_LABEL } from '@/packages/admin/enum/User/UserRoleEnum';
import type { InvitationFormDialogProps } from '@/packages/admin/types/Invitation/InvitationFormDialogTypes';
import type { InvitationFormValues } from '@/packages/admin/types/Invitation/InvitationTypes';
import { Dialog } from '@/shared/ui/Dialog';
import { Button, Field, Input, Select } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';

export function InvitationFormDialog({ onClose }: InvitationFormDialogProps) {
  const form = useInvitationFormHook();
  const create = useInvitationCreateHook();
  const locations = useLocationListHook();
  const locationIds = form.watch('locationIds');

  async function onSave(values: InvitationFormValues) {
    await create.mutateAsync(values);
    onClose();
  }

  return (
    <Dialog title="Novo convite" onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register('email')} />
        </Field>
        <Field label="Papel" error={form.formState.errors.role?.message}>
          <Select {...form.register('role')}>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {USER_ROLE_LABEL[role]}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset className="text-sm">
          <legend className="mb-1">Unidades (obrigatório se não for dono)</legend>
          {(locations.data ?? []).map((location) => (
            <label key={location.id} className="mr-3 inline-flex items-center gap-1">
              <input
                type="checkbox"
                checked={locationIds.includes(location.id)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...locationIds, location.id]
                    : locationIds.filter((id) => id !== location.id);
                  form.setValue('locationIds', next);
                }}
              />
              {location.name}
            </label>
          ))}
        </fieldset>
        {create.isError ? <p className="text-sm text-red-300">{apiErrorMessage(create.error)}</p> : null}
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Enviando…' : 'Enviar convite'}
        </Button>
      </form>
    </Dialog>
  );
}
