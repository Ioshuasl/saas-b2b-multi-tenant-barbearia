import type { RequestContext } from '../../shared/domain/request_context.js';
import { NotFoundError } from '../../shared/domain/errors.js';
import { inLocationScope } from './helpers/location_scope.js';
import { GetRepository } from './repositories/location/location_get.repository.js';
import { GetByUserRepository } from './repositories/staff/staff_get_by_user.repository.js';
import { WorkingWindowsRepository } from './repositories/working_window/working_window_get.repository.js';
import { SnapshotRepository } from './repositories/service/service_snapshot.repository.js';
import { ServesLocationRepository } from './repositories/staff/staff_serves_location.repository.js';
import { GetPublicRepository } from './repositories/tenant/tenant_get_public.repository.js';

const getLocation = new GetRepository();
const getStaffByUser = new GetByUserRepository();
const workingWindows = new WorkingWindowsRepository();
const snapshot = new SnapshotRepository();
const servesLocation = new ServesLocationRepository();
const getPublic = new GetPublicRepository();

function systemCtx(tenantId: string): RequestContext {
  return {
    tenantId,
    userId: '00000000-0000-0000-0000-000000000000',
    requestId: 'locations_public',
    role: 'SYSTEM',
    locationScope: 'ALL',
    locationIds: [],
  };
}

export async function assertLocationAccessible(
  ctx: RequestContext,
  locationId: string,
): Promise<void> {
  const location = await getLocation.execute(ctx, locationId);
  if (!location || !inLocationScope(ctx.locationScope, ctx.locationIds, location.id)) {
    throw new NotFoundError();
  }
}

export async function getStaffIdForUser(
  userId: string,
  tenantId: string,
): Promise<string | undefined> {
  const id = await getStaffByUser.execute(systemCtx(tenantId), userId);
  return id ?? undefined;
}

export async function getWorkingWindows(input: {
  tenantId: string;
  locationId: string;
  staffId?: string;
  date: string;
}): Promise<Array<{ startsAt: Date; endsAt: Date }>> {
  return workingWindows.execute(systemCtx(input.tenantId), {
    locationId: input.locationId,
    staffId: input.staffId,
    date: input.date,
  });
}

export async function getServiceSnapshot(
  tenantId: string,
  locationId: string,
  serviceId: string,
): Promise<{ durationMinutes: number; priceCents: number } | null> {
  return snapshot.execute(systemCtx(tenantId), locationId, serviceId);
}

export async function staffServesLocation(
  tenantId: string,
  staffId: string,
  locationId: string,
): Promise<boolean> {
  return servesLocation.execute(systemCtx(tenantId), staffId, locationId);
}

export async function getTenantPublic(slug: string): Promise<{
  id: string;
  name: string;
  locations: Array<{ id: string; slug: string; name: string }>;
} | null> {
  return getPublic.execute(slug);
}
