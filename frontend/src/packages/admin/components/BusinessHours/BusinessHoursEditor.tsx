'use client';

import { useEffect } from 'react';
import {
  businessHoursFormValues,
  useBusinessHoursFormHook,
} from '@/packages/admin/hooks/BusinessHours/useBusinessHoursFormHook';
import { useBusinessHoursGetHook } from '@/packages/admin/hooks/BusinessHours/useBusinessHoursGetHook';
import { useBusinessHoursUpdateHook } from '@/packages/admin/hooks/BusinessHours/useBusinessHoursUpdateHook';
import { WEEKDAYS } from '@/packages/admin/enum/BusinessHours/WeekdayEnum';
import { useSessionStore } from '@/shared/auth/session';
import { Button, Field, Input } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';
import type { BusinessHoursFormValues } from '@/packages/admin/types/BusinessHours/BusinessHoursTypes';

export function BusinessHoursEditor({
  locationId,
  onSaved,
}: {
  locationId: string;
  onSaved?: () => void;
}) {
  const hours = useBusinessHoursGetHook(locationId);
  const form = useBusinessHoursFormHook(hours.data);
  const update = useBusinessHoursUpdateHook();
  const canWrite = useSessionStore((s) => s.me?.permissions.includes('settings.write') ?? false);

  useEffect(() => {
    if (hours.data) form.reset(businessHoursFormValues(hours.data));
    // reset quando os horários chegam
  }, [hours.data]);

  async function onSave(values: BusinessHoursFormValues) {
    const slots = values.slots
      .filter((slot) => slot.enabled)
      .map(({ weekday, startsAt, endsAt }) => ({ weekday, startsAt, endsAt }));
    await update.mutateAsync({ locationId, slots });
    onSaved?.();
  }

  if (hours.isLoading) return <p className="text-sm opacity-70">Carregando horários…</p>;

  return (
    <form className="flex max-w-lg flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
      {WEEKDAYS.map((day, index) => (
        <div key={day.weekday} className="grid grid-cols-[7rem_auto_1fr_1fr] items-center gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...form.register(`slots.${index}.enabled`)} disabled={!canWrite} />
            {day.label}
          </label>
          <span className="opacity-50">de</span>
          <Field label="" error={form.formState.errors.slots?.[index]?.startsAt?.message}>
            <Input type="time" {...form.register(`slots.${index}.startsAt`)} disabled={!canWrite} />
          </Field>
          <Field label="" error={form.formState.errors.slots?.[index]?.endsAt?.message}>
            <Input type="time" {...form.register(`slots.${index}.endsAt`)} disabled={!canWrite} />
          </Field>
        </div>
      ))}
      {update.isError ? <p className="text-sm text-red-300">{apiErrorMessage(update.error)}</p> : null}
      {canWrite ? (
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? 'Salvando…' : 'Salvar horários'}
        </Button>
      ) : null}
    </form>
  );
}
