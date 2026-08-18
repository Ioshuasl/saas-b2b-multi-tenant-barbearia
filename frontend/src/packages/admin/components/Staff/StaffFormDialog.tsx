'use client';

import { useEffect } from 'react';
import { staffFormValues, useStaffFormHook } from '@/packages/admin/hooks/Staff/useStaffFormHook';
import { useStaffCreateHook } from '@/packages/admin/hooks/Staff/useStaffCreateHook';
import { useStaffUpdateHook } from '@/packages/admin/hooks/Staff/useStaffUpdateHook';
import { useLocationListHook } from '@/packages/admin/hooks/Location/useLocationListHook';
import { useServiceListHook } from '@/packages/admin/hooks/Service/useServiceListHook';
import type { StaffFormDialogProps } from '@/packages/admin/types/Staff/StaffFormDialogTypes';
import type { StaffFormValues } from '@/packages/admin/types/Staff/StaffTypes';
import { Dialog } from '@/shared/ui/Dialog';
import { Button, Field, Input, Select } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';
import { useSessionStore } from '@/shared/auth/session';

export function StaffFormDialog({ staff, onClose }: StaffFormDialogProps) {
  const defaultLocationId = useSessionStore((s) => s.locationId) ?? undefined;
  const form = useStaffFormHook(staff, defaultLocationId);
  const create = useStaffCreateHook();
  const update = useStaffUpdateHook();
  const locations = useLocationListHook();
  const services = useServiceListHook();
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  function handleForm() {
    form.reset(staffFormValues(staff, defaultLocationId));
  }

  useEffect(() => {
    handleForm();
    // reset quando o registro muda
  }, [staff]);

  async function onSave(values: StaffFormValues) {
    const locationIds = values.locationIds.includes(values.homeLocationId)
      ? values.locationIds
      : [...values.locationIds, values.homeLocationId];
    const payload = { ...values, locationIds };
    if (staff) await update.mutateAsync({ id: staff.id, values: payload });
    else await create.mutateAsync(payload);
    onClose();
  }

  const locationIds = form.watch('locationIds');
  const serviceIds = form.watch('serviceIds');

  return (
    <Dialog title={staff ? 'Editar profissional' : 'Novo profissional'} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
        <Field label="Nome" error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} />
        </Field>
        <Field label="Unidade principal" error={form.formState.errors.homeLocationId?.message}>
          <Select {...form.register('homeLocationId')}>
            <option value="">Selecione</option>
            {(locations.data ?? []).map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Bio" error={form.formState.errors.bio?.message}>
          <Input {...form.register('bio')} />
        </Field>
        <Field label="Comissão (%)" error={form.formState.errors.commissionPercent?.message}>
          <Input type="number" step="0.1" {...form.register('commissionPercent')} />
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
        <fieldset className="text-sm">
          <legend className="mb-1">Serviços</legend>
          {(services.data ?? []).map((service) => (
            <label key={service.id} className="mr-3 inline-flex items-center gap-1">
              <input
                type="checkbox"
                checked={serviceIds.includes(service.id)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...serviceIds, service.id]
                    : serviceIds.filter((id) => id !== service.id);
                  form.setValue('serviceIds', next);
                }}
              />
              {service.name}
            </label>
          ))}
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('acceptsOnlineBooking')} /> Aceita online
        </label>
        {staff ? (
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
