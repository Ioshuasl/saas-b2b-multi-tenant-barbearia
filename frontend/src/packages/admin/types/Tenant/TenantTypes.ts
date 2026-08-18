export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
  status: string;
  trialEndsAt: string | null;
};

export type TenantFormValues = {
  name: string;
  slug: string;
  logoUrl: string;
  brandColor: string;
};

export type SlugAvailable = {
  available: boolean;
  suggestion?: string;
};
