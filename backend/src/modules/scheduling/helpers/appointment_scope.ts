import { NotFoundError } from '../../../shared/domain/errors.js';
import { isLocationInScope } from '../../locations/locations_public.js';
import type { RequestContext } from '../../../shared/domain/request_context.js';

export function assertStaffAccess(
  ctx: RequestContext,
  staffId: string,
  actorStaffId?: string,
): void {
  if (ctx.role === 'STAFF') {
    if (!actorStaffId || actorStaffId !== staffId) {
      throw new NotFoundError();
    }
  }
}

export function resolveStaffFilter(
  ctx: RequestContext,
  requestedStaffId: string | undefined,
  actorStaffId?: string,
): string | undefined {
  if (ctx.role === 'STAFF') {
    if (!actorStaffId) throw new NotFoundError();
    return actorStaffId;
  }
  return requestedStaffId;
}

export function assertLocationInScope(ctx: RequestContext, locationId: string): void {
  if (!isLocationInScope(ctx.locationScope, ctx.locationIds, locationId)) {
    throw new NotFoundError();
  }
}
