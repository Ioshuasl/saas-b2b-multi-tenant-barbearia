'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InvitationDeleteService } from '@/packages/admin/services/Invitation/InvitationDeleteService';

export function useInvitationDeleteHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: InvitationDeleteService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations'] }),
  });
}
