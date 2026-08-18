import { apiClient } from '@/shared/api/api-client';
import type { TenantFormValues, TenantSummary } from '@/packages/admin/types/Tenant/TenantTypes';

export async function TenantUpdateData(values: TenantFormValues): Promise<TenantSummary> {
  const brandColor = /^#[0-9A-Fa-f]{6}$/.test(values.brandColor) ? values.brandColor : null;
  return apiClient.request('/tenant', {
    method: 'PATCH',
    body: JSON.stringify({
      name: values.name,
      slug: values.slug,
      logoUrl: values.logoUrl || null,
      brandColor,
    }),
  });
}
