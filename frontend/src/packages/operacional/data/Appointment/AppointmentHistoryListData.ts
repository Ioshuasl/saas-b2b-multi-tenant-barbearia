import { apiClient } from '@/shared/api/api-client';
import type { AppointmentHistoryItem } from '@repo/contracts';

export async function AppointmentHistoryListData(id: string): Promise<AppointmentHistoryItem[]> {
  return apiClient.request(`/appointments/${id}/history`);
}
