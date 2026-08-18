import { apiClient } from '@/shared/api/api-client';
import type { ServiceSummary } from '@/packages/admin/types/Service/ServiceTypes';

export async function ServiceListData(): Promise<ServiceSummary[]> {
  return apiClient.request('/services');
}
