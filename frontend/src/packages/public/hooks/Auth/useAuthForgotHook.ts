'use client';

import { useMutation } from '@tanstack/react-query';
import { AuthForgotService } from '@/packages/public/services/Auth/AuthForgotService';

export function useAuthForgotHook() {
  return useMutation({ mutationFn: AuthForgotService });
}
