import { apiClient } from '@/shared/api/api-client';
import type { BusinessHoursView } from '@/packages/admin/types/BusinessHours/BusinessHoursTypes';

export async function BusinessHoursGetData(locationId: string): Promise<BusinessHoursView> {
  return apiClient.request('/business-hours', { query: { locationId } });
}
