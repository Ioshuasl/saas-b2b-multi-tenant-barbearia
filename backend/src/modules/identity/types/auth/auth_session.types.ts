export type AuthUserSummary = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantSlug: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserSummary;
};
