import { apiClient } from '@/shared/api/api-client';
import type { CustomerDetail } from '@repo/contracts';

export async function CustomerGetData(id: string): Promise<CustomerDetail> {
  return apiClient.request(`/customers/${id}`);
}
