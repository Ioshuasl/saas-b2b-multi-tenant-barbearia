'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authSignupSchema } from '@/packages/public/schemas/Auth/AuthSchema';
import type { AuthSignupValues } from '@/packages/public/types/Auth/AuthTypes';

export function useAuthSignupFormHook() {
  return useForm<AuthSignupValues>({
    resolver: zodResolver(authSignupSchema),
    defaultValues: { email: '', password: '', tenantName: '', phone: '' },
  });
}
