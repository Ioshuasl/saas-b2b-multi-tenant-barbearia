import { OnboardingUpdateData } from '@/packages/admin/data/Onboarding/OnboardingUpdateData';
import type { OnboardingStep } from '@/packages/admin/types/Onboarding/OnboardingTypes';

export async function OnboardingUpdateService(step: OnboardingStep) {
  return OnboardingUpdateData(step);
}
