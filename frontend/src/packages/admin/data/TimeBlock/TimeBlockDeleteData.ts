import { apiClient } from '@/shared/api/api-client';

export async function TimeBlockDeleteData(id: string): Promise<{ ok: boolean }> {
  return apiClient.request(`/time-blocks/${id}`, { method: 'DELETE' });
}
