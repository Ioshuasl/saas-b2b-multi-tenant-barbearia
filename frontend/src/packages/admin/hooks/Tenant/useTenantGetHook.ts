'use client';

import { useQuery } from '@tanstack/react-query';
import { TenantGetService } from '@/packages/admin/services/Tenant/TenantGetService';

export function useTenantGetHook() {
  return useQuery({
    queryKey: ['tenant', 'get'],
    queryFn: TenantGetService,
  });
}
