'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authForgotSchema } from '@/packages/public/schemas/Auth/AuthSchema';
import type { AuthForgotValues } from '@/packages/public/types/Auth/AuthTypes';

export function useAuthForgotFormHook() {
  return useForm<AuthForgotValues>({
    resolver: zodResolver(authForgotSchema),
    defaultValues: { email: '' },
  });
}
