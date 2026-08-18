import { apiClient } from '@/shared/api/api-client';
import type { CustomerCreateBody, CustomerDetail } from '@repo/contracts';

export async function CustomerCreateData(customerSchema: CustomerCreateBody): Promise<CustomerDetail> {
  return apiClient.request('/customers', {
    method: 'POST',
    body: JSON.stringify(customerSchema),
  });
}
