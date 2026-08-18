'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StaffInviteService } from '@/packages/admin/services/Staff/StaffInviteService';

export function useStaffInviteHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) => StaffInviteService(id, email),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['invitations'] });
      void qc.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}
