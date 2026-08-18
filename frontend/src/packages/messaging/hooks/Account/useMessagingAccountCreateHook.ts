'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessagingAccountCreateService } from '@/packages/messaging/services/Account/MessagingAccountCreateService';

export function useMessagingAccountCreateHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: MessagingAccountCreateService,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messaging', 'account'] });
    },
  });
}
