import { MessagingAccountGetData } from '@/packages/messaging/data/Account/MessagingAccountGetData';

export async function MessagingAccountGetService() {
  return MessagingAccountGetData();
}
