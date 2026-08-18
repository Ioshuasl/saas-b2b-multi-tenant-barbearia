import { cache } from 'react';
import { PublicTenantGetService } from '@/packages/public/services/PublicTenant/PublicTenantGetService';
import { PublicLocationGetService } from '@/packages/public/services/PublicLocation/PublicLocationGetService';

export const loadPublicTenant = cache(PublicTenantGetService);

export const loadPublicLocation = cache(async (tenantSlug: string, locationSlug: string) =>
  PublicLocationGetService({ tenantSlug, locationSlug }),
);
