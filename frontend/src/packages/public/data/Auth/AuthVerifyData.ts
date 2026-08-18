import { apiClient } from '@/shared/api/api-client';

export async function AuthVerifyData(token: string): Promise<{ ok: boolean }> {
  return apiClient.request('/auth/verify-email', {
    method: 'POST',
    skipRefresh: true,
    body: JSON.stringify({ token }),
  });
}
