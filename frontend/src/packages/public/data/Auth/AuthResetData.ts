import { apiClient } from '@/shared/api/api-client';
import type { AuthResetValues } from '@/packages/public/types/Auth/AuthTypes';

export async function AuthResetData(authReset: AuthResetValues): Promise<{ ok: boolean }> {
  return apiClient.request('/auth/password/reset', {
    method: 'POST',
    skipRefresh: true,
    body: JSON.stringify(authReset),
  });
}
