'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppointmentCreateService } from '@/packages/operacional/services/Appointment/AppointmentCreateService';

export function useAppointmentCreateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: AppointmentCreateService,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['appointments'] });
      await qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
