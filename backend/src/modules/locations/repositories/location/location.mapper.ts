import type { Location } from '@prisma/client';
import type { LocationSummary } from '../../types/location/location_get.types.js';

export function toLocationSummary(row: Location): LocationSummary {
  return {
    id: row.id,
    tenantId: row.tenantId,
    slug: row.slug,
    name: row.name,
    timezone: row.timezone,
    isDefault: row.isDefault,
    active: row.active,
  };
}
