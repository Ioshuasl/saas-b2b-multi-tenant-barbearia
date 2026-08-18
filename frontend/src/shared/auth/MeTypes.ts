export type MeUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  tenantId: string;
  tenantSlug: string;
  emailVerifiedAt: string | null;
};

export type MeResponse = {
  user: MeUser;
  role: string;
  locationIds: string[] | 'ALL';
  permissions: readonly string[];
  staffId: string | null;
};

export type AuthSessionPayload = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    tenantSlug: string;
  };
};
