'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentSchema } from '@/packages/operacional/schemas/Appointment/AppointmentSchema';
import { AppointmentSource } from '@/packages/operacional/enum/Appointment/AppointmentSourceEnum';
import type { AppointmentFormValues } from '@/packages/operacional/schemas/Appointment/AppointmentSchema';
import type { AppointmentDetail, AppointmentSummary } from '@repo/contracts';
import type { AppointmentSlotDraft } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export function appointmentFormValues(
  appointment?: AppointmentSummary | AppointmentDetail | null,
  draft?: AppointmentSlotDraft | null,
): AppointmentFormValues {
  return {
    customerId: appointment?.customerId ?? '',
    staffId: appointment?.staffId ?? draft?.staffId ?? '',
    serviceIds: appointment?.services.map((service) => service.serviceId) ?? [],
    startsAt: appointment?.startsAt ?? draft?.startsAt ?? '',
    source: appointment?.source ?? AppointmentSource.PANEL,
    notes: appointment && 'notes' in appointment ? (appointment.notes ?? '') : '',
    notifyCustomer: true,
  };
}

export function useAppointmentFormHook(
  appointment?: AppointmentSummary | AppointmentDetail | null,
  draft?: AppointmentSlotDraft | null,
) {
  return useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: appointmentFormValues(appointment, draft),
  });
}
