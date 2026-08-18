import { apiClient } from '@/shared/api/api-client';
import type { OnboardingState } from '@/packages/admin/types/Onboarding/OnboardingTypes';

export async function OnboardingGetData(): Promise<OnboardingState> {
  return apiClient.request('/tenant/onboarding');
}
