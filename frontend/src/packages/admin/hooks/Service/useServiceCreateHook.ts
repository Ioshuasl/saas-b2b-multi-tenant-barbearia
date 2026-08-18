'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceCreateService } from '@/packages/admin/services/Service/ServiceCreateService';

export function useServiceCreateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ServiceCreateService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}
