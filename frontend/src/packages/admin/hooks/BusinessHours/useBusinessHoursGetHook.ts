'use client';

import { useQuery } from '@tanstack/react-query';
import { BusinessHoursGetService } from '@/packages/admin/services/BusinessHours/BusinessHoursGetService';

export function useBusinessHoursGetHook(locationId: string | null) {
  return useQuery({
    queryKey: ['business-hours', locationId],
    queryFn: () => BusinessHoursGetService(locationId as string),
    enabled: Boolean(locationId),
  });
}
