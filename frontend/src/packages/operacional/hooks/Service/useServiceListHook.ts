'use client';

import { useQuery } from '@tanstack/react-query';
import { ServiceListService } from '@/packages/operacional/services/Service/ServiceListService';

export function useServiceListHook(enabled = true) {
  return useQuery({
    queryKey: ['services', 'list'],
    queryFn: ServiceListService,
    enabled,
    staleTime: 60_000,
  });
}
