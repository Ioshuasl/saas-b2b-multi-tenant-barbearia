'use client';

import { useQuery } from '@tanstack/react-query';
import { CustomerGetService } from '@/packages/operacional/services/Customer/CustomerGetService';

export function useCustomerGetHook(id: string | null) {
  return useQuery({
    queryKey: ['customers', 'get', id],
    queryFn: () => CustomerGetService(id as string),
    enabled: Boolean(id),
  });
}
