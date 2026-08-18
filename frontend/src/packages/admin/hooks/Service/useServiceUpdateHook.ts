'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceUpdateService } from '@/packages/admin/services/Service/ServiceUpdateService';
import type { ServiceFormValues } from '@/packages/admin/types/Service/ServiceTypes';

export function useServiceUpdateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ServiceFormValues }) =>
      ServiceUpdateService(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}
