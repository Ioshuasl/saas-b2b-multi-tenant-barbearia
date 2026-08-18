export type InvitationSummary = {
  id: string;
  email: string;
  role: string;
  locationIds: string[];
  expiresAt: string;
  acceptedAt: string | null;
  invitedBy: string;
  createdAt: string;
};

export type UserSummary = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  locationIds: string[];
  emailVerifiedAt: string | null;
};

export type MeResponse = {
  user: {
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
  role: string;
  locationIds: string[] | 'ALL';
  permissions: readonly string[];
  staffId: string | null;
};
