'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OnboardingUpdateService } from '@/packages/admin/services/Onboarding/OnboardingUpdateService';

export function useOnboardingUpdateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: OnboardingUpdateService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding'] }),
  });
}
