import { z } from 'zod';
import { ONBOARDING_STEPS } from '../enum/onboarding/onboarding_step.enum.js';

export const onboardingUpdateSchema = z.object({
  step: z.enum(ONBOARDING_STEPS),
});

export type OnboardingUpdateSchema = z.infer<typeof onboardingUpdateSchema>;
