'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { SessionLogoutService } from '@/packages/admin/services/Session/SessionLogoutService';
import { useSessionStore } from '@/shared/auth/session';

export function useSessionLogoutHook() {
  const qc = useQueryClient();
  const router = useRouter();
  const clear = useSessionStore((s) => s.clear);

  return useMutation({
    mutationFn: SessionLogoutService,
    onSettled: () => {
      clear();
      qc.clear();
      router.replace('/login');
    },
  });
}
