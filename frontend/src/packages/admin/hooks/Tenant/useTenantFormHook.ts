'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenantSchema } from '@/packages/admin/schemas/Tenant/TenantSchema';
import type { TenantFormValues, TenantSummary } from '@/packages/admin/types/Tenant/TenantTypes';

export function tenantFormValues(tenant?: TenantSummary): TenantFormValues {
  return {
    name: tenant?.name ?? '',
    slug: tenant?.slug ?? '',
    logoUrl: tenant?.logoUrl ?? '',
    brandColor: tenant?.brandColor ?? '',
  };
}

export function useTenantFormHook(tenant?: TenantSummary) {
  return useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: tenantFormValues(tenant),
  });
}
