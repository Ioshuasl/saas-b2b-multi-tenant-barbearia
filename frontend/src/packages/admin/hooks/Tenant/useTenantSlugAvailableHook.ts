'use client';

import { useQuery } from '@tanstack/react-query';
import { TenantSlugAvailableService } from '@/packages/admin/services/Tenant/TenantSlugAvailableService';

export function useTenantSlugAvailableHook(slug: string) {
  return useQuery({
    queryKey: ['tenant', 'slug', slug],
    queryFn: () => TenantSlugAvailableService(slug),
    enabled: slug.length >= 2,
  });
}
