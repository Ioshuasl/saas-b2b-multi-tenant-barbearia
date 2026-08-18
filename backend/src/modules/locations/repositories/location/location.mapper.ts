import type { Location } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { LocationAddress, LocationSummary } from '../../types/location/location.types.js';

export function toLocationSummary(row: Location): LocationSummary {
  return {
    id: row.id,
    tenantId: row.tenantId,
    slug: row.slug,
    name: row.name,
    timezone: row.timezone,
    phone: row.phone,
    email: row.email,
    address: toAddress(row.address),
    coverUrl: row.coverUrl,
    bookingLeadTimeMinutes: row.bookingLeadTimeMinutes,
    bookingHorizonDays: row.bookingHorizonDays,
    cancelDeadlineHours: row.cancelDeadlineHours,
    acceptsOnlineBooking: row.acceptsOnlineBooking,
    isDefault: row.isDefault,
    active: row.active,
  };
}

function toAddress(value: Prisma.JsonValue | null): LocationAddress | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  return {
    zip: str(raw.zip),
    street: str(raw.street),
    number: str(raw.number),
    complement: str(raw.complement),
    district: str(raw.district),
    city: str(raw.city),
    state: str(raw.state),
  };
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
