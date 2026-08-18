'use client';

import { useQuery } from '@tanstack/react-query';
import { LocationListService } from '@/packages/operacional/services/Location/LocationListService';

export function useLocationListHook(enabled = true) {
  return useQuery({
    queryKey: ['locations', 'list'],
    queryFn: LocationListService,
    enabled,
    staleTime: 60_000,
  });
}
