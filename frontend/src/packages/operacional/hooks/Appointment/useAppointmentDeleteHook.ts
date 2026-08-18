'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppointmentDeleteService } from '@/packages/operacional/services/Appointment/AppointmentDeleteService';
import type { AppointmentCancelBody } from '@repo/contracts';

export function useAppointmentDeleteHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, appointmentSchema }: { id: string; appointmentSchema: AppointmentCancelBody }) =>
      AppointmentDeleteService(id, appointmentSchema),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['appointments'] });
      await qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
