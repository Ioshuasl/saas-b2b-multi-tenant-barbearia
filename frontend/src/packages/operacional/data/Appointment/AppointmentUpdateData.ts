import { apiClient } from '@/shared/api/api-client';
import type { AppointmentDetail, AppointmentUpdateBody } from '@repo/contracts';

export async function AppointmentUpdateData(
  id: string,
  appointmentSchema: AppointmentUpdateBody,
): Promise<AppointmentDetail> {
  return apiClient.request(`/appointments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(appointmentSchema),
  });
}
