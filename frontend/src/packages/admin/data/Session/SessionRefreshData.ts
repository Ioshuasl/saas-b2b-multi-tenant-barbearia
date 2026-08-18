import { apiClient } from '@/shared/api/api-client';

export async function SessionRefreshData(): Promise<void> {
  await apiClient.refresh();
}
