'use client';

import { useEffect } from 'react';
import {
  locationFormValues,
  useLocationFormHook,
} from '@/packages/admin/hooks/Location/useLocationFormHook';
import { useLocationCreateHook } from '@/packages/admin/hooks/Location/useLocationCreateHook';
import { useLocationUpdateHook } from '@/packages/admin/hooks/Location/useLocationUpdateHook';
import type { LocationFormDialogProps } from '@/packages/admin/types/Location/LocationFormDialogTypes';
import type { LocationFormValues } from '@/packages/admin/types/Location/LocationTypes';
import { Dialog } from '@/shared/ui/Dialog';
import { Button, Field, Input } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';

export function LocationFormDialog({ location, onClose }: LocationFormDialogProps) {
  const form = useLocationFormHook(location);
  const create = useLocationCreateHook();
  const update = useLocationUpdateHook();
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  function handleForm() {
    form.reset(locationFormValues(location));
  }

  useEffect(() => {
    handleForm();
    // reset quando o registro muda
  }, [location]);

  async function onSave(values: LocationFormValues) {
    if (location) await update.mutateAsync({ id: location.id, values });
    else await create.mutateAsync(values);
    onClose();
  }

  return (
    <Dialog title={location ? 'Editar unidade' : 'Nova unidade'} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
        <Field label="Nome" error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} />
        </Field>
        <Field label="Slug" error={form.formState.errors.slug?.message}>
          <Input {...form.register('slug')} placeholder="opcional na criação" />
        </Field>
        <Field label="Fuso" error={form.formState.errors.timezone?.message}>
          <Input {...form.register('timezone')} />
        </Field>
        <Field label="Telefone" error={form.formState.errors.phone?.message}>
          <Input {...form.register('phone')} />
        </Field>
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register('email')} />
        </Field>
        <Field label="Cidade" error={form.formState.errors.city?.message}>
          <Input {...form.register('city')} />
        </Field>
        {location ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('active')} /> Ativa
          </label>
        ) : null}
        {location ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('isDefault')} /> Unidade padrão
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
