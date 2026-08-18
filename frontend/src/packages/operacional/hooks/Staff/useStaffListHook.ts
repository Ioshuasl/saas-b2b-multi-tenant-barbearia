'use client';

import { useQuery } from '@tanstack/react-query';
import { StaffListService } from '@/packages/operacional/services/Staff/StaffListService';

export function useStaffListHook(enabled = true) {
  return useQuery({
    queryKey: ['staff', 'list'],
    queryFn: StaffListService,
    enabled,
    staleTime: 60_000,
  });
}
