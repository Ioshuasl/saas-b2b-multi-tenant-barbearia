'use client';

import { useMutation } from '@tanstack/react-query';
import { AuthAcceptInviteService } from '@/packages/public/services/Auth/AuthAcceptInviteService';

export function useAuthAcceptInviteHook() {
  return useMutation({ mutationFn: AuthAcceptInviteService });
}
