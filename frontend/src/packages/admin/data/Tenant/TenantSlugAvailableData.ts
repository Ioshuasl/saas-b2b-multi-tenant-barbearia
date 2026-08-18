import { apiClient } from '@/shared/api/api-client';
import type { SlugAvailable } from '@/packages/admin/types/Tenant/TenantTypes';

export async function TenantSlugAvailableData(slug: string): Promise<SlugAvailable> {
  return apiClient.request('/tenant/slug-available', { query: { slug } });
}
