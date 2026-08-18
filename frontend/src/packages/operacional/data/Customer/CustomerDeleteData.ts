import { apiClient } from '@/shared/api/api-client';

export async function CustomerDeleteData(id: string): Promise<void> {
  await apiClient.request(`/customers/${id}`, { method: 'DELETE' });
}
