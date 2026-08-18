'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TenantUpdateService } from '@/packages/admin/services/Tenant/TenantUpdateService';

export function useTenantUpdateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: TenantUpdateService,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tenant'] });
      void qc.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}
