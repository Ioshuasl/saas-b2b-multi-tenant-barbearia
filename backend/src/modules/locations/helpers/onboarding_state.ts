import { env } from '../../../shared/config/env.js';
import type { OnboardingState } from '../types/onboarding/onboarding.types.js';
import type { OnboardingRecord } from '../repositories/onboarding/onboarding_get.repository.js';

type WizardStep = 'hours' | 'services' | 'staff';

export function parseStored(raw: unknown): {
  completedSteps: WizardStep[];
  publishedAt: string | null;
} {
  if (!raw || typeof raw !== 'object') {
    return { completedSteps: [], publishedAt: null };
  }
  const obj = raw as Record<string, unknown>;
  const steps = Array.isArray(obj.completedSteps)
    ? obj.completedSteps.filter(
        (step): step is WizardStep =>
          step === 'hours' || step === 'services' || step === 'staff',
      )
    : [];
  return {
    completedSteps: steps,
    publishedAt: typeof obj.publishedAt === 'string' ? obj.publishedAt : null,
  };
}

export function toOnboardingState(record: OnboardingRecord): OnboardingState {
  const stored = parseStored(record.onboarding);
  const locationSlug = record.defaultLocationSlug ?? 'default';
  const published = Boolean(stored.publishedAt);
  return {
    completedSteps: stored.completedSteps,
    publishedAt: stored.publishedAt,
    public: published
      ? {
          tenantPath: `/${record.tenantSlug}`,
          locationPath: `/${record.tenantSlug}/${locationSlug}`,
          tenantUrl: `${env.APP_PUBLIC_URL}/${record.tenantSlug}`,
          locationUrl: `${env.APP_PUBLIC_URL}/${record.tenantSlug}/${locationSlug}`,
        }
      : null,
  };
}
