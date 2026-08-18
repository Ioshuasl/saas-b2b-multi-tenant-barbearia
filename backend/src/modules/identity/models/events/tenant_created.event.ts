export const TENANT_CREATED_EVENT = 'identity.tenant_created';

export type TenantCreatedPayload = {
  tenantId: string;
  userId: string;
  slug: string;
};
