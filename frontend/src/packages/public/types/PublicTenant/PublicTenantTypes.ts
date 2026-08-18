import type { PublicTenant } from '@repo/contracts';

export type { PublicTenant };

export type PublicTenantIndexProps = {
  tenantSlug: string;
};

export type PublicLocationPickerProps = {
  tenant: PublicTenant;
};
