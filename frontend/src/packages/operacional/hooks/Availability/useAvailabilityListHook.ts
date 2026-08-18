'use client';

import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@/shared/auth/session';
import { AvailabilityListService } from '@/packages/operacional/services/Availability/AvailabilityListService';
import type { AvailabilityListQuery } from '@repo/contracts';

export function useAvailabilityListHook(query: AvailabilityListQuery | null) {
  const locationId = useSessionStore((s) => s.locationId);
  const scoped = query
    ? { ...query, locationId: query.locationId || locationId || '' }
    : null;

  return useQuery({
    queryKey: [
      'availability',
      'list',
      scoped?.locationId,
      scoped?.from,
      scoped?.to,
      scoped?.staffId,
      scoped?.serviceIds,
    ],
    queryFn: () => AvailabilityListService(scoped as AvailabilityListQuery),
    enabled: Boolean(
      scoped?.locationId && scoped.serviceIds.length > 0 && scoped.from && scoped.to,
    ),
    staleTime: 15_000,
  });
}
