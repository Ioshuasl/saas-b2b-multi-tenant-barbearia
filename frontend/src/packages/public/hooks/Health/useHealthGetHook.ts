'use client';

import { useQuery } from '@tanstack/react-query';
import { HealthGetService } from '@/packages/public/services/Health/HealthGetService';

export function useHealthGetHook() {
  return useQuery({
    queryKey: ['health'],
    queryFn: HealthGetService,
    retry: 0,
  });
}
