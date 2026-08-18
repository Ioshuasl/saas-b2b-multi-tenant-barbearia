import { NotFoundError } from '../../../../shared/domain/errors.js';
import { getPublicLocationBySlug, getTenantPublic } from '../../../locations/locations_public.js';
import { publicCtx } from '../../helpers/public_context.js';
import type { PublicSlugScope } from '../../types/public/public_booking.types.js';

export class ScopeService {
  async resolveTenant(tenantSlug: string, requestId: string) {
    const tenant = await getTenantPublic(tenantSlug);
    if (!tenant) throw new NotFoundError();
    return { tenant, ctx: publicCtx(tenant.id, requestId) };
  }

  async resolveLocation(
    tenantSlug: string,
    locationSlug: string,
    requestId: string,
  ): Promise<{ scope: PublicSlugScope; ctx: ReturnType<typeof publicCtx> }> {
    const { tenant } = await this.resolveTenant(tenantSlug, requestId);
    const location = await getPublicLocationBySlug(tenant.id, locationSlug);
    if (!location) throw new NotFoundError();

    return {
      scope: {
        tenantId: tenant.id,
        tenantSlug,
        locationId: location.id,
        locationSlug,
      },
      ctx: publicCtx(tenant.id, requestId, location.id),
    };
  }
}
