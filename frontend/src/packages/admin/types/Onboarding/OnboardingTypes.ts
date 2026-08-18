export type OnboardingStep = 'hours' | 'services' | 'staff' | 'publish';

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
