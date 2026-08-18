export type SignupPersistInput = {
  tenantId: string;
  tenantName: string;
  slug: string;
  trialEndsAt: Date;
  locationId: string;
  userId: string;
  email: string;
  passwordHash: string;
  ownerName: string;
  phone: string;
  wrappedDek: string;
  cryptoKeyId: string;
  services: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    sortOrder: number;
  }>;
  businessHours: Array<{
    id: string;
    weekday: number;
    startsAt: Date;
    endsAt: Date;
  }>;
};

export type SignupPersistResult = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  userId: string;
  email: string;
  name: string;
  role: string;
};
