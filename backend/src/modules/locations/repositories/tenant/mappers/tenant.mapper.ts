import type { Tenant } from '@prisma/client';
import type { TenantSummary } from '../../../types/tenant/tenant.types.js';

export function toTenantSummary(row: Tenant): TenantSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logoUrl,
    brandColor: row.brandColor,
    status: row.status,
    trialEndsAt: row.trialEndsAt?.toISOString() ?? null,
  };
}
