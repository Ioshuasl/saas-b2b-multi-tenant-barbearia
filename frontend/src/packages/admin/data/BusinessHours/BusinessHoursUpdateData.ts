import { apiClient } from '@/shared/api/api-client';
import type {
  BusinessHoursSlot,
  BusinessHoursView,
} from '@/packages/admin/types/BusinessHours/BusinessHoursTypes';

export async function BusinessHoursUpdateData(
  locationId: string,
  slots: BusinessHoursSlot[],
): Promise<BusinessHoursView> {
  return apiClient.request('/business-hours', {
    method: 'PUT',
    body: JSON.stringify({ locationId, slots }),
  });
}
