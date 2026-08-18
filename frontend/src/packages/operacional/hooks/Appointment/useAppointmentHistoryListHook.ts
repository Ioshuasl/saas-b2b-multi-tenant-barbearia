'use client';

import { useQuery } from '@tanstack/react-query';
import { AppointmentHistoryListService } from '@/packages/operacional/services/Appointment/AppointmentHistoryListService';

export function useAppointmentHistoryListHook(id: string | null) {
  return useQuery({
    queryKey: ['appointments', 'history', id],
    queryFn: () => AppointmentHistoryListService(id as string),
    enabled: Boolean(id),
  });
}
