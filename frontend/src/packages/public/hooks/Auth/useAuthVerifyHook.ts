'use client';

import { useMutation } from '@tanstack/react-query';
import { AuthVerifyService } from '@/packages/public/services/Auth/AuthVerifyService';

export function useAuthVerifyHook() {
  return useMutation({ mutationFn: AuthVerifyService });
}
