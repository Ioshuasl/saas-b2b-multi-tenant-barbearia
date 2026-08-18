export const ONBOARDING_STEPS = ['hours', 'services', 'staff', 'publish'] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
