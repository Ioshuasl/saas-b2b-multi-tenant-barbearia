'use client';

import { useQuery } from '@tanstack/react-query';
import { MessagingSessionStatus } from '@/packages/messaging/enum/Account/MessagingSessionStatusEnum';
import { MessagingAccountQrService } from '@/packages/messaging/services/Account/MessagingAccountQrService';

export function useMessagingAccountQrHook(enabled: boolean) {
  return useQuery({
    queryKey: ['messaging', 'account', 'qr'],
    queryFn: MessagingAccountQrService,
    enabled,
    refetchInterval: (query) =>
      query.state.data?.status === MessagingSessionStatus.CONNECTED ? false : 2_500,
  });
}
