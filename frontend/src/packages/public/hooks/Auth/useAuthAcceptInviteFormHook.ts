'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authAcceptInviteSchema } from '@/packages/public/schemas/Auth/AuthSchema';
import type { AuthAcceptInviteValues } from '@/packages/public/types/Auth/AuthTypes';

export function useAuthAcceptInviteFormHook(token: string) {
  return useForm<AuthAcceptInviteValues>({
    resolver: zodResolver(authAcceptInviteSchema),
    defaultValues: { token, password: '', name: '' },
  });
}
