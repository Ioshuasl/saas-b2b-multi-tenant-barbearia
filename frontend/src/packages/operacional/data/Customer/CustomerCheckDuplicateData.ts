import { apiClient } from '@/shared/api/api-client';
import type { CustomerDuplicateCheck } from '@repo/contracts';

export async function CustomerCheckDuplicateData(phone: string): Promise<CustomerDuplicateCheck> {
  return apiClient.request('/customers/check-duplicate', {
    query: { phone },
  });
}
