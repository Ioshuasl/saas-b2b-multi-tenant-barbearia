import { apiClient } from '@/shared/api/api-client';
import type { CustomerAppointmentsResult } from '@repo/contracts';

export async function CustomerAppointmentsListData(id: string): Promise<CustomerAppointmentsResult> {
  return apiClient.request(`/customers/${id}/appointments`);
}
