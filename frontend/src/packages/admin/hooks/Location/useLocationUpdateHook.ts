'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LocationUpdateService } from '@/packages/admin/services/Location/LocationUpdateService';
import type { LocationFormValues } from '@/packages/admin/types/Location/LocationTypes';

export function useLocationUpdateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: LocationFormValues }) =>
      LocationUpdateService(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}
