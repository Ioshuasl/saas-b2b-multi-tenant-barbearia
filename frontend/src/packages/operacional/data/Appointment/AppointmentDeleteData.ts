import { apiClient } from '@/shared/api/api-client';
import type { AppointmentCancelBody } from '@repo/contracts';

export async function AppointmentDeleteData(
  id: string,
  appointmentSchema: AppointmentCancelBody,
): Promise<void> {
  await apiClient.request(`/appointments/${id}`, {
    method: 'DELETE',
    body: JSON.stringify(appointmentSchema),
  });
}
