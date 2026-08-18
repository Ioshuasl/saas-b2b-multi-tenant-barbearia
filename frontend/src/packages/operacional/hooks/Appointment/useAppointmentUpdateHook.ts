'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppointmentUpdateService } from '@/packages/operacional/services/Appointment/AppointmentUpdateService';
import type { AppointmentUpdateBody } from '@repo/contracts';

export function useAppointmentUpdateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, appointmentSchema }: { id: string; appointmentSchema: AppointmentUpdateBody }) =>
      AppointmentUpdateService(id, appointmentSchema),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['appointments'] });
      await qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
