'use client';

import { useMutation } from '@tanstack/react-query';
import { AuthResetService } from '@/packages/public/services/Auth/AuthResetService';

export function useAuthResetHook() {
  return useMutation({ mutationFn: AuthResetService });
}
