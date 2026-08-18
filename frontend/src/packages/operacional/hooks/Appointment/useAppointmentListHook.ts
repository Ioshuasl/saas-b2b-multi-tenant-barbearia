'use client';

import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@/shared/auth/session';
import { AppointmentListService } from '@/packages/operacional/services/Appointment/AppointmentListService';
import type { AppointmentListQuery } from '@repo/contracts';

export function useAppointmentListHook(query: AppointmentListQuery) {
  const locationId = useSessionStore((s) => s.locationId);
  const scoped: AppointmentListQuery = {
    ...query,
    locationId: query.locationId ?? locationId ?? undefined,
  };

  return useQuery({
    queryKey: ['appointments', 'list', scoped.locationId, scoped.from, scoped.to, scoped.staffId, scoped.status],
    queryFn: () => AppointmentListService(scoped),
    enabled: Boolean(scoped.locationId && scoped.from && scoped.to),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
