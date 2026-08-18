import { apiClient } from '@/shared/api/api-client';
import type { LocationSummary } from '@/packages/admin/types/Location/LocationTypes';

export async function LocationListData(): Promise<LocationSummary[]> {
  return apiClient.request('/locations');
}
