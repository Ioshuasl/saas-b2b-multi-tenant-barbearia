'use client';

import { useQuery } from '@tanstack/react-query';
import { PublicAvailabilityListService } from '@/packages/public/services/PublicAvailability/PublicAvailabilityListService';
import type { PublicAvailabilityListQuery } from '@repo/contracts';

export function usePublicAvailabilityListHook(query: PublicAvailabilityListQuery | null) {
  return useQuery({
    queryKey: [
      'public-availability',
      'list',
      query?.tenantSlug,
      query?.locationSlug,
      query?.from,
      query?.to,
      query?.staffId,
      query?.serviceIds,
    ],
    queryFn: () => PublicAvailabilityListService(query as PublicAvailabilityListQuery),
    enabled: Boolean(
      query?.tenantSlug &&
        query.locationSlug &&
        query.serviceIds.length > 0 &&
        query.from &&
        query.to,
    ),
    staleTime: 15_000,
  });
}
