'use client';

import { useQuery } from '@tanstack/react-query';
import { MessagingAccountGetService } from '@/packages/messaging/services/Account/MessagingAccountGetService';

export function useMessagingAccountGetHook(enabled = true) {
  return useQuery({
    queryKey: ['messaging', 'account', 'get'],
    queryFn: MessagingAccountGetService,
    enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}
