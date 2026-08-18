import { apiClient } from '@/shared/api/api-client';
import type { AuthAcceptInviteValues } from '@/packages/public/types/Auth/AuthTypes';

export async function AuthAcceptInviteData(
  authAccept: AuthAcceptInviteValues,
): Promise<{ ok: boolean }> {
  return apiClient.request('/users/invitations/accept', {
    method: 'POST',
    skipRefresh: true,
    body: JSON.stringify(authAccept),
  });
}
