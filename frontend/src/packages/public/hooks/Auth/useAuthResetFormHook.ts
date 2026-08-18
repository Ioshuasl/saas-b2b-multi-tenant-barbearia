'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authResetSchema } from '@/packages/public/schemas/Auth/AuthSchema';
import type { AuthResetValues } from '@/packages/public/types/Auth/AuthTypes';

export function useAuthResetFormHook(token: string) {
  return useForm<AuthResetValues>({
    resolver: zodResolver(authResetSchema),
    defaultValues: { token, password: '' },
  });
}
