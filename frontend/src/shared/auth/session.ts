'use client';

import { create } from 'zustand';
import { apiClient } from '@/shared/api/api-client';
import type { MeResponse } from '@/shared/auth/MeTypes';

type SessionState = {
  me: MeResponse | null;
  locationId: string | null;
  bootstrapped: boolean;
  setMe: (me: MeResponse | null) => void;
  setLocationId: (locationId: string | null) => void;
  setAccessToken: (token: string | null) => void;
  setBootstrapped: (value: boolean) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  me: null,
  locationId: null,
  bootstrapped: false,
  setMe: (me) => set({ me }),
  setLocationId: (locationId) => {
    apiClient.setLocationId(locationId);
    set({ locationId });
  },
  setAccessToken: (token) => {
    apiClient.setAccessToken(token);
  },
  setBootstrapped: (bootstrapped) => set({ bootstrapped }),
  clear: () => {
    apiClient.setAccessToken(null);
    apiClient.setLocationId(null);
    set({ me: null, locationId: null });
  },
}));

export function hasPermission(permission: string): boolean {
  const me = useSessionStore.getState().me;
  return Boolean(me?.permissions.includes(permission));
}
