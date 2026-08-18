import type { MessagingAccountFormValues } from '@/packages/messaging/types/Account/MessagingAccountTypes';

export type MessagingConnectFormProps = {
  pending: boolean;
  error: unknown;
  onConnect: (values: MessagingAccountFormValues) => Promise<void>;
};
