'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InvitationCreateService } from '@/packages/admin/services/Invitation/InvitationCreateService';

export function useInvitationCreateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: InvitationCreateService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations'] }),
  });
}
