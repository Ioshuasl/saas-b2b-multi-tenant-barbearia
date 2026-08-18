'use client';

import { useQuery } from '@tanstack/react-query';
import { StaffListService } from '@/packages/admin/services/Staff/StaffListService';

export function useStaffListHook() {
  return useQuery({
    queryKey: ['staff', 'list'],
    queryFn: StaffListService,
  });
}
