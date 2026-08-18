import { apiClient } from '@/shared/api/api-client';
import type { MessagingAccountSummary } from '@/packages/messaging/types/Account/MessagingAccountTypes';

export async function MessagingAccountDeleteData(): Promise<MessagingAccountSummary> {
  return apiClient.request('/messaging/account', { method: 'DELETE' });
}
