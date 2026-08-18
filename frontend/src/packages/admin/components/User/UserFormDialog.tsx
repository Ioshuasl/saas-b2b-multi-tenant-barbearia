'use client';

import { useEffect } from 'react';
import { userFormValues, useUserFormHook } from '@/packages/admin/hooks/User/useUserFormHook';
import { useUserUpdateHook } from '@/packages/admin/hooks/User/useUserUpdateHook';
import { useLocationListHook } from '@/packages/admin/hooks/Location/useLocationListHook';
import { USER_ROLES, USER_ROLE_LABEL } from '@/packages/admin/enum/User/UserRoleEnum';
import type { UserFormDialogProps } from '@/packages/admin/types/User/UserFormDialogTypes';
import type { UserFormValues } from '@/packages/admin/types/User/UserTypes';
import { Dialog } from '@/shared/ui/Dialog';
import { Button, Field, Select } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';

export function UserFormDialog({ user, onClose }: UserFormDialogProps) {
  const form = useUserFormHook(user);
  const update = useUserUpdateHook();
  const locations = useLocationListHook();

  function handleForm() {
    form.reset(userFormValues(user));
  }

  useEffect(() => {
    handleForm();
    // reset quando o membro muda
  }, [user]);

  async function onSave(values: UserFormValues) {
    await update.mutateAsync({ id: user.id, values });
    onClose();
  }

  const locationIds = form.watch('locationIds');

  return (
    <Dialog title={`Editar ${user.name}`} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
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
          <legend className="mb-1">Unidades</legend>
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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('active')} /> Ativo
        </label>
        {update.isError ? <p className="text-sm text-red-300">{apiErrorMessage(update.error)}</p> : null}
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>
    </Dialog>
  );
}
