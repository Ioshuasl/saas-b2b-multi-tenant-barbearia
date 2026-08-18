'use client';

import { useQuery } from '@tanstack/react-query';
import { OnboardingGetService } from '@/packages/admin/services/Onboarding/OnboardingGetService';

export function useOnboardingGetHook(enabled = true) {
  return useQuery({
    queryKey: ['onboarding', 'get'],
    queryFn: OnboardingGetService,
    enabled,
  });
}
