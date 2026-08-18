'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from '@/packages/admin/schemas/User/UserSchema';
import type { UserFormValues, UserSummary } from '@/packages/admin/types/User/UserTypes';

export function userFormValues(user: UserSummary): UserFormValues {
  return {
    role: user.role as UserFormValues['role'],
    active: user.status === 'ACTIVE',
    locationIds: user.locationIds,
  };
}

export function useUserFormHook(user: UserSummary) {
  return useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: userFormValues(user),
  });
}
