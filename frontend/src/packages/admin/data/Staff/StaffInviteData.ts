import { apiClient } from '@/shared/api/api-client';
import type { InvitationSummary } from '@/packages/admin/types/Invitation/InvitationTypes';

export async function StaffInviteData(id: string, email: string): Promise<InvitationSummary> {
  return apiClient.request(`/staff/${id}/invite`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
