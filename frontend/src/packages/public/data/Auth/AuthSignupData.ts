import { apiClient } from '@/shared/api/api-client';
import type { AuthSessionPayload, AuthSignupValues } from '@/packages/public/types/Auth/AuthTypes';

export async function AuthSignupData(authSignup: AuthSignupValues): Promise<AuthSessionPayload> {
  return apiClient.request('/auth/signup', {
    method: 'POST',
    skipRefresh: true,
    body: JSON.stringify(authSignup),
  });
}
