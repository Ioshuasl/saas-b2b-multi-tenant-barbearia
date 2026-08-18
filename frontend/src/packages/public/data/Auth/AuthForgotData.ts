import { apiClient } from '@/shared/api/api-client';
import type { AuthForgotValues } from '@/packages/public/types/Auth/AuthTypes';

export async function AuthForgotData(authForgot: AuthForgotValues): Promise<{ ok: boolean }> {
  return apiClient.request('/auth/password/forgot', {
    method: 'POST',
    skipRefresh: true,
    body: JSON.stringify(authForgot),
  });
}
