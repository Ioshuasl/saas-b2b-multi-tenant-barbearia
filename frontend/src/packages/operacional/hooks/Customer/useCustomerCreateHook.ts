'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerCreateService } from '@/packages/operacional/services/Customer/CustomerCreateService';

export function useCustomerCreateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: CustomerCreateService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}
