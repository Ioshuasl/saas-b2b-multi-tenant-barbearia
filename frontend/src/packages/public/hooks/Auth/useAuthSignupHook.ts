'use client';

import { useMutation } from '@tanstack/react-query';
import { AuthSignupService } from '@/packages/public/services/Auth/AuthSignupService';
import { useSessionStore } from '@/shared/auth/session';

export function useAuthSignupHook() {
  const setAccessToken = useSessionStore((s) => s.setAccessToken);
  return useMutation({
    mutationFn: AuthSignupService,
    onSuccess: (session) => {
      setAccessToken(session.accessToken);
    },
  });
}
