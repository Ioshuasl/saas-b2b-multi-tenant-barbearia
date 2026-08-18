import { apiClient } from '@/shared/api/api-client';

export async function HealthGetData(): Promise<{ status: string; service: string }> {
  return apiClient.request('/health');
}
