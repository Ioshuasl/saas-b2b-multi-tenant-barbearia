import { apiClient } from '@/shared/api/api-client';
import type {
  InvitationFormValues,
  InvitationSummary,
} from '@/packages/admin/types/Invitation/InvitationTypes';

export async function InvitationCreateData(
  values: InvitationFormValues,
): Promise<InvitationSummary> {
  return apiClient.request('/users/invitations', {
    method: 'POST',
    body: JSON.stringify({
      email: values.email,
      role: values.role,
      locationIds: values.locationIds,
    }),
  });
}
