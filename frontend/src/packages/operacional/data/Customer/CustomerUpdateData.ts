import { apiClient } from '@/shared/api/api-client';
import type { CustomerDetail, CustomerUpdateBody } from '@repo/contracts';

export async function CustomerUpdateData(
  id: string,
  customerSchema: CustomerUpdateBody,
): Promise<CustomerDetail> {
  return apiClient.request(`/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(customerSchema),
  });
}
