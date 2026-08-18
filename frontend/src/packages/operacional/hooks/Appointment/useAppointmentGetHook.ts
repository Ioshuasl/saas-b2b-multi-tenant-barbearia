'use client';

import { useQuery } from '@tanstack/react-query';
import { AppointmentGetService } from '@/packages/operacional/services/Appointment/AppointmentGetService';

export function useAppointmentGetHook(id: string | null) {
  return useQuery({
    queryKey: ['appointments', 'get', id],
    queryFn: () => AppointmentGetService(id as string),
    enabled: Boolean(id),
  });
}
