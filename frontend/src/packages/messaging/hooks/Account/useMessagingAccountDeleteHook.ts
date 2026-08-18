'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessagingAccountDeleteService } from '@/packages/messaging/services/Account/MessagingAccountDeleteService';

export function useMessagingAccountDeleteHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: MessagingAccountDeleteService,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messaging', 'account'] });
    },
  });
}
