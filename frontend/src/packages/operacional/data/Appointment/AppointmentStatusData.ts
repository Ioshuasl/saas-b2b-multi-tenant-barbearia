import { apiClient } from '@/shared/api/api-client';
import type { AppointmentDetail, AppointmentStatusBody } from '@repo/contracts';

export async function AppointmentStatusData(
  id: string,
  appointmentSchema: AppointmentStatusBody,
): Promise<AppointmentDetail> {
  return apiClient.request(`/appointments/${id}/status`, {
    method: 'POST',
    body: JSON.stringify(appointmentSchema),
  });
}
