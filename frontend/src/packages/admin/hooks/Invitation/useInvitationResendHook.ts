'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InvitationResendService } from '@/packages/admin/services/Invitation/InvitationResendService';

export function useInvitationResendHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: InvitationResendService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations'] }),
  });
}
