import type { Staff } from '@prisma/client';
import type { StaffSummary } from '../../../types/staff/staff.types.js';

export function toStaffSummary(
  row: Staff & { staffLocations: { locationId: string }[]; staffServices: { serviceId: string }[] },
): StaffSummary {
  return {
    id: row.id,
    name: row.name,
    photoUrl: row.photoUrl,
    bio: row.bio,
    homeLocationId: row.homeLocationId,
    userId: row.userId,
    commissionPercent: Number(row.commissionPercent),
    acceptsOnlineBooking: row.acceptsOnlineBooking,
    active: row.active,
    locationIds: row.staffLocations.map((item) => item.locationId),
    serviceIds: row.staffServices.map((item) => item.serviceId),
  };
}
