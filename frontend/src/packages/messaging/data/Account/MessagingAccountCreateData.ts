import { apiClient } from '@/shared/api/api-client';
import type {
  MessagingAccountConnectResult,
  MessagingAccountFormValues,
} from '@/packages/messaging/types/Account/MessagingAccountTypes';

export async function MessagingAccountCreateData(
  accountSchema: MessagingAccountFormValues,
): Promise<MessagingAccountConnectResult> {
  return apiClient.request('/messaging/account', {
    method: 'POST',
    body: JSON.stringify({ riskAccepted: accountSchema.riskAccepted }),
  });
}
