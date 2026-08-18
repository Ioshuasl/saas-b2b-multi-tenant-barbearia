import type { OnboardingStep } from '../../enum/onboarding/onboarding_step.enum.js';

export type OnboardingState = {
  completedSteps: Exclude<OnboardingStep, 'publish'>[];
  publishedAt: string | null;
  public: {
    tenantPath: string;
    locationPath: string;
    tenantUrl: string;
    locationUrl: string;
  } | null;
};
