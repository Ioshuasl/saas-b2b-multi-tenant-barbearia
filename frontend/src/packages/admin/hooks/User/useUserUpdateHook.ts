'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserUpdateService } from '@/packages/admin/services/User/UserUpdateService';
import type { UserFormValues } from '@/packages/admin/types/User/UserTypes';

export function useUserUpdateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserFormValues }) =>
      UserUpdateService(id, values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] });
      void qc.invalidateQueries({ queryKey: ['session'] });
    },
  });
}
