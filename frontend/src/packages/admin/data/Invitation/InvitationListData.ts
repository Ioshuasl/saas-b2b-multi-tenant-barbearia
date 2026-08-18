import { apiClient } from '@/shared/api/api-client';
import type { InvitationSummary } from '@/packages/admin/types/Invitation/InvitationTypes';

export async function InvitationListData(): Promise<InvitationSummary[]> {
  return apiClient.request('/users/invitations');
}
