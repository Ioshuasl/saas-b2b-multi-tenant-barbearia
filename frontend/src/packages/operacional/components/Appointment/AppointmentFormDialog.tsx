'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  appointmentFormValues,
  useAppointmentFormHook,
} from '@/packages/operacional/hooks/Appointment/useAppointmentFormHook';
import { useAppointmentCreateHook } from '@/packages/operacional/hooks/Appointment/useAppointmentCreateHook';
import { useAppointmentUpdateHook } from '@/packages/operacional/hooks/Appointment/useAppointmentUpdateHook';
import { useStaffListHook } from '@/packages/operacional/hooks/Staff/useStaffListHook';
import { useServiceListHook } from '@/packages/operacional/hooks/Service/useServiceListHook';
import { useAvailabilityListHook } from '@/packages/operacional/hooks/Availability/useAvailabilityListHook';
import { CustomerPicker } from '@/packages/operacional/components/Customer/CustomerPicker';
import {
  APPOINTMENT_SOURCE_LABELS,
  PANEL_APPOINTMENT_SOURCES,
} from '@/packages/operacional/enum/Appointment/AppointmentSourceEnum';
import { formatDayKey, formatTimeInTimezone } from '@/packages/operacional/helpers/appointment_timezone';
import type { AppointmentFormDialogProps } from '@/packages/operacional/types/Appointment/AppointmentTypes';
import type { AppointmentFormValues } from '@/packages/operacional/schemas/Appointment/AppointmentSchema';
import { Dialog } from '@/shared/ui/Dialog';
import { Button, Field, Select, Textarea } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';
import { useLocationListHook } from '@/packages/operacional/hooks/Location/useLocationListHook';
import { useSessionStore } from '@/shared/auth/session';
import type { CustomerSummary } from '@repo/contracts';

export function AppointmentFormDialog({ appointment, draft, dayKey, onClose }: AppointmentFormDialogProps) {
  const locationId = useSessionStore((s) => s.locationId);
  const canWriteNotes = useSessionStore((s) => s.me?.permissions.includes('agenda.write') ?? false);
  const locationsQuery = useLocationListHook();
  const timezone =
    locationsQuery.data?.find((location) => location.id === locationId)?.timezone ??
    'America/Sao_Paulo';
  const form = useAppointmentFormHook(appointment, draft);
  const create = useAppointmentCreateHook();
  const update = useAppointmentUpdateHook();
  const staffQuery = useStaffListHook();
  const servicesQuery = useServiceListHook();
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;
  const isCreate = !appointment;

  const [customerLabel, setCustomerLabel] = useState(appointment?.customerName ?? '');

  const staffId = form.watch('staffId');
  const serviceIds = form.watch('serviceIds');
  const startsAt = form.watch('startsAt');

  const availabilityDay = startsAt
    ? formatDayKey(new Date(startsAt), timezone)
    : draft?.dayKey ?? dayKey;

  const availabilityQuery = useAvailabilityListHook(
    locationId && serviceIds.length > 0 && availabilityDay
      ? {
          locationId,
          serviceIds,
          staffId: staffId || undefined,
          from: availabilityDay,
          to: availabilityDay,
        }
      : null,
  );

  const staffOptions = useMemo(() => {
    const all = (staffQuery.data ?? []).filter((item) => item.active);
    if (!locationId) return all;
    return all.filter((item) => item.locationIds.includes(locationId));
  }, [staffQuery.data, locationId]);

  const serviceOptions = useMemo(
    () => (servicesQuery.data ?? []).filter((item) => item.active),
    [servicesQuery.data],
  );

  function handleForm() {
    form.reset(appointmentFormValues(appointment, draft));
    setCustomerLabel(appointment?.customerName ?? '');
  }

  useEffect(() => {
    handleForm();
  }, [appointment, draft]);

  async function onSave(values: AppointmentFormValues) {
    if (appointment) {
      await update.mutateAsync({
        id: appointment.id,
        appointmentSchema: {
          staffId: values.staffId,
          serviceIds: values.serviceIds,
          startsAt: values.startsAt,
          notes: canWriteNotes ? values.notes || undefined : undefined,
        },
      });
    } else {
      await create.mutateAsync({
        customerId: values.customerId,
        staffId: values.staffId,
        serviceIds: values.serviceIds,
        startsAt: values.startsAt,
        source: values.source,
        notes: canWriteNotes ? values.notes || undefined : undefined,
        notifyCustomer: values.notifyCustomer,
      });
    }
    onClose();
  }

  function onCustomerSelect(customer: CustomerSummary) {
    form.setValue('customerId', customer.id, { shouldValidate: true });
    setCustomerLabel(customer.name);
  }

  return (
    <Dialog title={appointment ? 'Editar agendamento' : 'Novo agendamento'} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
        {isCreate ? (
          <Field label="Cliente" error={form.formState.errors.customerId?.message}>
            <CustomerPicker
              valueId={form.watch('customerId')}
              valueLabel={customerLabel}
              onSelect={onCustomerSelect}
            />
          </Field>
        ) : (
          <p className="text-sm">
            Cliente: <strong>{appointment.customerName}</strong>
          </p>
        )}
        <Field label="Profissional" error={form.formState.errors.staffId?.message}>
          <Select {...form.register('staffId')}>
            <option value="">Selecione</option>
            {staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset className="text-sm">
          <legend className="mb-1">Serviços</legend>
          {serviceOptions.map((service) => (
            <label key={service.id} className="mr-3 inline-flex items-center gap-1">
              <input
                type="checkbox"
                checked={serviceIds.includes(service.id)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...serviceIds, service.id]
                    : serviceIds.filter((id) => id !== service.id);
                  form.setValue('serviceIds', next, { shouldValidate: true });
                }}
              />
              {service.name}
            </label>
          ))}
          {form.formState.errors.serviceIds ? (
            <span className="mt-1 block text-xs text-red-300">
              {form.formState.errors.serviceIds.message}
            </span>
          ) : null}
        </fieldset>
        <Field label="Horário" error={form.formState.errors.startsAt?.message}>
          {availabilityQuery.data?.slots.length ? (
            <Select
              id="appointment-slot"
              value={startsAt}
              onChange={(event) => form.setValue('startsAt', event.target.value, { shouldValidate: true })}
            >
              <option value="">Selecione um horário</option>
              {availabilityQuery.data.slots.map((slot) => (
                <option key={slot.startsAt} value={slot.startsAt}>
                  {formatTimeInTimezone(slot.startsAt, availabilityQuery.data.timezone)} — {slot.staffName}
                </option>
              ))}
            </Select>
          ) : startsAt ? (
            <p className="text-sm opacity-80">{formatTimeInTimezone(startsAt, timezone)}</p>
          ) : (
            <p className="text-sm opacity-60">Selecione serviços e profissional para ver horários.</p>
          )}
          <input type="hidden" {...form.register('startsAt')} />
        </Field>
        {isCreate ? (
          <Field label="Origem" error={form.formState.errors.source?.message}>
            <Select {...form.register('source')}>
              {PANEL_APPOINTMENT_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {APPOINTMENT_SOURCE_LABELS[source]}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        {canWriteNotes ? (
          <Field label="Observações" error={form.formState.errors.notes?.message}>
            <Textarea {...form.register('notes')} maxLength={2000} />
          </Field>
        ) : null}
        {isCreate ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('notifyCustomer')} />
            Notificar cliente
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
