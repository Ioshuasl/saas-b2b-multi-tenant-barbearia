'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LocationCreateService } from '@/packages/admin/services/Location/LocationCreateService';

export function useLocationCreateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: LocationCreateService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}
