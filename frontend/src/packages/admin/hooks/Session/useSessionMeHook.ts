'use client';

import { useQuery } from '@tanstack/react-query';
import { SessionMeService } from '@/packages/admin/services/Session/SessionMeService';
import { useSessionStore } from '@/shared/auth/session';

export function useSessionMeHook() {
  return useQuery({
    queryKey: ['session', 'me'],
    queryFn: async () => {
      const me = await SessionMeService();
      useSessionStore.getState().setMe(me);
      return me;
    },
    retry: false,
    staleTime: 60_000,
  });
}
