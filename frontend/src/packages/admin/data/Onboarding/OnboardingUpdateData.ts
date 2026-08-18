import { apiClient } from '@/shared/api/api-client';
import type { OnboardingState, OnboardingStep } from '@/packages/admin/types/Onboarding/OnboardingTypes';

export async function OnboardingUpdateData(step: OnboardingStep): Promise<OnboardingState> {
  return apiClient.request('/tenant/onboarding', {
    method: 'PATCH',
    body: JSON.stringify({ step }),
  });
}
