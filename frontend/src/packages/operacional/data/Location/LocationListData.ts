import { apiClient } from '@/shared/api/api-client';
import type { LocationSummary } from '@repo/contracts';

export async function LocationListData(): Promise<LocationSummary[]> {
  return apiClient.request('/locations');
}
