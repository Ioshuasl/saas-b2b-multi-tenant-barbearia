import { apiClient } from '@/shared/api/api-client';
import type { TenantSummary } from '@/packages/admin/types/Tenant/TenantTypes';

export async function TenantGetData(): Promise<TenantSummary> {
  return apiClient.request('/tenant');
}
