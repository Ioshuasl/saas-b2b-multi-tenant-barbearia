'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerUpdateService } from '@/packages/operacional/services/Customer/CustomerUpdateService';
import type { CustomerUpdateBody } from '@repo/contracts';

export function useCustomerUpdateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, customerSchema }: { id: string; customerSchema: CustomerUpdateBody }) =>
      CustomerUpdateService(id, customerSchema),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}
