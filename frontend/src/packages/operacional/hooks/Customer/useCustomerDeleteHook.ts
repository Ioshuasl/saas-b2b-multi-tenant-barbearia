'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerDeleteService } from '@/packages/operacional/services/Customer/CustomerDeleteService';

export function useCustomerDeleteHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: CustomerDeleteService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}
