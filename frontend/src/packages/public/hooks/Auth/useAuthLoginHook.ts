'use client';

import { useMutation } from '@tanstack/react-query';
import { AuthLoginService } from '@/packages/public/services/Auth/AuthLoginService';
import { useSessionStore } from '@/shared/auth/session';

export function useAuthLoginHook() {
  const setAccessToken = useSessionStore((s) => s.setAccessToken);
  return useMutation({
    mutationFn: AuthLoginService,
    onSuccess: (session) => {
      setAccessToken(session.accessToken);
    },
  });
}
