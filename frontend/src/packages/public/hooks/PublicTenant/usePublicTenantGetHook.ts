'use client';

import { useQuery } from '@tanstack/react-query';
import { PublicTenantGetService } from '@/packages/public/services/PublicTenant/PublicTenantGetService';

export function usePublicTenantGetHook(tenantSlug: string | null) {
  return useQuery({
    queryKey: ['public-tenant', 'get', tenantSlug],
    queryFn: () => PublicTenantGetService(tenantSlug as string),
    enabled: Boolean(tenantSlug),
    staleTime: 60_000,
  });
}
