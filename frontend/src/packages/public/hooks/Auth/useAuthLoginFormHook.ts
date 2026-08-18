'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authLoginSchema } from '@/packages/public/schemas/Auth/AuthSchema';
import type { AuthLoginValues } from '@/packages/public/types/Auth/AuthTypes';

export function useAuthLoginFormHook() {
  return useForm<AuthLoginValues>({
    resolver: zodResolver(authLoginSchema),
    defaultValues: { email: '', password: '' },
  });
}
