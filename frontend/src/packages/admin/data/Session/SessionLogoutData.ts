import { apiClient } from '@/shared/api/api-client';

export async function SessionLogoutData(): Promise<{ ok: boolean }> {
  return apiClient.request('/auth/logout', {
    method: 'POST',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
}
