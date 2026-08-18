'use client';

import { useQuery } from '@tanstack/react-query';
import { TimeBlockListService } from '@/packages/admin/services/TimeBlock/TimeBlockListService';

export function useTimeBlockListHook(locationId: string | null) {
  return useQuery({
    queryKey: ['time-blocks', locationId],
    queryFn: () => TimeBlockListService(locationId as string),
    enabled: Boolean(locationId),
  });
}
