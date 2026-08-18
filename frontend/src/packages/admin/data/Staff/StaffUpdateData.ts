import { apiClient } from '@/shared/api/api-client';
import type { StaffFormValues, StaffSummary } from '@/packages/admin/types/Staff/StaffTypes';

export async function StaffUpdateData(id: string, values: StaffFormValues): Promise<StaffSummary> {
  return apiClient.request(`/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: values.name,
      homeLocationId: values.homeLocationId,
      bio: values.bio || null,
      commissionPercent: values.commissionPercent,
      acceptsOnlineBooking: values.acceptsOnlineBooking,
      active: values.active,
    }),
  });
}
