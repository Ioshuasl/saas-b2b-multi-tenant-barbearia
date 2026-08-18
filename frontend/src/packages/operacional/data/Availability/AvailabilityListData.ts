import { apiClient } from '@/shared/api/api-client';
import type { AvailabilityListQuery, AvailabilityResult } from '@repo/contracts';

export async function AvailabilityListData(query: AvailabilityListQuery): Promise<AvailabilityResult> {
  return apiClient.request('/availability', {
    method: 'GET',
    query: {
      locationId: query.locationId,
      serviceIds: query.serviceIds.join(','),
      staffId: query.staffId,
      from: query.from,
      to: query.to,
    },
  });
}
