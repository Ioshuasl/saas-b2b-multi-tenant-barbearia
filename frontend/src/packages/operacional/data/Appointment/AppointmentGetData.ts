import { apiClient } from '@/shared/api/api-client';
import type { AppointmentDetail } from '@repo/contracts';

export async function AppointmentGetData(id: string): Promise<AppointmentDetail> {
  return apiClient.request(`/appointments/${id}`);
}
