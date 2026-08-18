'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppointmentStatusService } from '@/packages/operacional/services/Appointment/AppointmentStatusService';
import type { AppointmentStatusBody } from '@repo/contracts';

export function useAppointmentStatusHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, appointmentSchema }: { id: string; appointmentSchema: AppointmentStatusBody }) =>
      AppointmentStatusService(id, appointmentSchema),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}
