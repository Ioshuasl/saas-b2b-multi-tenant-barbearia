import { apiClient } from '@/shared/api/api-client';

export async function InvitationResendData(id: string): Promise<{ ok: boolean }> {
  return apiClient.request(`/users/invitations/${id}/resend`, { method: 'POST' });
}
