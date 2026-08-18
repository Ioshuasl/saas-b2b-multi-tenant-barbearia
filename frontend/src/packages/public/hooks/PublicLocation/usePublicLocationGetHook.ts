'use client';

import { useQuery } from '@tanstack/react-query';
import { PublicLocationGetService } from '@/packages/public/services/PublicLocation/PublicLocationGetService';
import type { PublicSlugParams } from '@repo/contracts';

export function usePublicLocationGetHook(publicSlugParams: PublicSlugParams | null) {
  return useQuery({
    queryKey: [
      'public-location',
      'get',
      publicSlugParams?.tenantSlug,
      publicSlugParams?.locationSlug,
    ],
    queryFn: () => PublicLocationGetService(publicSlugParams as PublicSlugParams),
    enabled: Boolean(publicSlugParams?.tenantSlug && publicSlugParams.locationSlug),
    staleTime: 60_000,
  });
}
