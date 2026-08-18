'use client';

import { useQuery } from '@tanstack/react-query';
import { CustomerCheckDuplicateService } from '@/packages/operacional/services/Customer/CustomerCheckDuplicateService';

export function useCustomerCheckDuplicateHook(phone: string, enabled = true) {
  return useQuery({
    queryKey: ['customers', 'check-duplicate', phone],
    queryFn: () => CustomerCheckDuplicateService(phone),
    enabled: enabled && Boolean(phone),
  });
}
