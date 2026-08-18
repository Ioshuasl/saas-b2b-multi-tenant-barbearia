'use client';

import { useQuery } from '@tanstack/react-query';
import { ServiceListService } from '@/packages/admin/services/Service/ServiceListService';

export function useServiceListHook() {
  return useQuery({
    queryKey: ['services', 'list'],
    queryFn: ServiceListService,
  });
}
