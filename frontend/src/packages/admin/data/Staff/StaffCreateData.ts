import { apiClient } from '@/shared/api/api-client';
import type { StaffFormValues, StaffSummary } from '@/packages/admin/types/Staff/StaffTypes';

export async function StaffCreateData(values: StaffFormValues): Promise<StaffSummary> {
  return apiClient.request('/staff', {
    method: 'POST',
    body: JSON.stringify({
      name: values.name,
      homeLocationId: values.homeLocationId,
      locationIds: values.locationIds.length ? values.locationIds : undefined,
      bio: values.bio || undefined,
      commissionPercent: values.commissionPercent,
      acceptsOnlineBooking: values.acceptsOnlineBooking,
    }),
  });
}
