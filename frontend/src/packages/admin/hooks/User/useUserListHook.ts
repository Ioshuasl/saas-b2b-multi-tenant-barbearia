'use client';

import { useQuery } from '@tanstack/react-query';
import { UserListService } from '@/packages/admin/services/User/UserListService';

export function useUserListHook() {
  return useQuery({
    queryKey: ['users', 'list'],
    queryFn: UserListService,
  });
}
