import { apiClient } from '@/shared/api/api-client';

export async function InvitationDeleteData(id: string): Promise<{ ok: boolean }> {
  return apiClient.request(`/users/invitations/${id}`, { method: 'DELETE' });
}
