'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { messagingAccountSchema } from '@/packages/messaging/schemas/Account/MessagingAccountSchema';
import type { MessagingAccountFormValues } from '@/packages/messaging/types/Account/MessagingAccountTypes';

export function messagingAccountFormValues(): MessagingAccountFormValues {
  return { riskAccepted: false };
}

export function useMessagingAccountFormHook() {
  return useForm<MessagingAccountFormValues>({
    resolver: zodResolver(messagingAccountSchema),
    defaultValues: messagingAccountFormValues(),
  });
}
