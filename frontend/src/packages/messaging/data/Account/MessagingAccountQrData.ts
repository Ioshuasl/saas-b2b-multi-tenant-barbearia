import { apiClient } from '@/shared/api/api-client';
import type { MessagingQrResult } from '@/packages/messaging/types/Account/MessagingAccountTypes';

export async function MessagingAccountQrData(): Promise<MessagingQrResult> {
  return apiClient.request('/messaging/account/qr');
}
