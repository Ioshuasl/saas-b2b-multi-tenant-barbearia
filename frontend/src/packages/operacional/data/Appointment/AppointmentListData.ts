import { apiClient } from '@/shared/api/api-client';
import type { AppointmentListQuery, AppointmentSummary } from '@repo/contracts';

export async function AppointmentListData(query: AppointmentListQuery): Promise<AppointmentSummary[]> {
  return apiClient.request('/appointments', {
    method: 'GET',
    query: {
      from: query.from,
      to: query.to,
      staffId: query.staffId,
      status: query.status,
      locationId: query.locationId,
    },
  });
}
