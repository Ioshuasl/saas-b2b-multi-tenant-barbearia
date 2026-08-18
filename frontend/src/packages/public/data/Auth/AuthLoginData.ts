import { apiClient } from '@/shared/api/api-client';
import type { AuthSessionPayload } from '@/packages/public/types/Auth/AuthTypes';
import type { AuthLoginValues } from '@/packages/public/types/Auth/AuthTypes';

export async function AuthLoginData(authLogin: AuthLoginValues): Promise<AuthSessionPayload> {
  return apiClient.request('/auth/login', {
    method: 'POST',
    skipRefresh: true,
    body: JSON.stringify(authLogin),
  });
}
