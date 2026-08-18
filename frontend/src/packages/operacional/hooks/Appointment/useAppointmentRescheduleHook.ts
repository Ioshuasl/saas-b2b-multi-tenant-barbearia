'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@/shared/api/api-client';
import { AppointmentUpdateService } from '@/packages/operacional/services/Appointment/AppointmentUpdateService';
import type { AppointmentSummary, AppointmentUpdateBody } from '@repo/contracts';

type RescheduleInput = {
  appointment: AppointmentSummary;
  appointmentSchema: AppointmentUpdateBody;
};

export function useAppointmentRescheduleHook(options?: { onSlotTaken?: () => void }) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ appointment, appointmentSchema }: RescheduleInput) =>
      AppointmentUpdateService(appointment.id, appointmentSchema),
    onMutate: async (input: RescheduleInput) => {
      await qc.cancelQueries({ queryKey: ['appointments'] });
      const snapshots = qc.getQueriesData<AppointmentSummary[]>({ queryKey: ['appointments', 'list'] });
      for (const [key, data] of snapshots) {
        if (!data) continue;
        qc.setQueryData(
          key,
          data.map((item) =>
            item.id === input.appointment.id
              ? {
                  ...item,
                  startsAt: input.appointmentSchema.startsAt ?? item.startsAt,
                  staffId: input.appointmentSchema.staffId ?? item.staffId,
                }
              : item,
          ),
        );
      }
      return { snapshots };
    },
    onError: (error, _input, context) => {
      if (context?.snapshots) {
        for (const [key, data] of context.snapshots) {
          qc.setQueryData(key, data);
        }
      }
      if (error instanceof ApiClientError && error.code === 'SLOT_TAKEN') {
        options?.onSlotTaken?.();
      }
      void qc.invalidateQueries({ queryKey: ['appointments'] });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['appointments'] });
      await qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
