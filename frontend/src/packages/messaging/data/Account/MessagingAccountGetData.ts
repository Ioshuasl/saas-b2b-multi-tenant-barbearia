import { apiClient, ApiClientError } from '@/shared/api/api-client';
import type { MessagingAccountSummary } from '@/packages/messaging/types/Account/MessagingAccountTypes';

export async function MessagingAccountGetData(): Promise<MessagingAccountSummary | null> {
  try {
    return await apiClient.request('/messaging/account');
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) return null;
    throw err;
  }
}
