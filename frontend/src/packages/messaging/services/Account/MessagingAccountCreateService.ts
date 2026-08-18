import { MessagingAccountCreateData } from '@/packages/messaging/data/Account/MessagingAccountCreateData';
import type { MessagingAccountFormValues } from '@/packages/messaging/types/Account/MessagingAccountTypes';

export async function MessagingAccountCreateService(accountSchema: MessagingAccountFormValues) {
  return MessagingAccountCreateData(accountSchema);
}
