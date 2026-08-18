import { NotFoundError } from '../../../../shared/domain/errors.js';
import { getPublicLocationBySlug } from '../../../locations/locations_public.js';
import type { ScopeService } from './public_scope.service.js';

export class LocationGetService {
  constructor(private readonly scope: ScopeService) {}

  async execute(tenantSlug: string, locationSlug: string, requestId: string) {
    const { scope } = await this.scope.resolveLocation(tenantSlug, locationSlug, requestId);
    const location = await getPublicLocationBySlug(scope.tenantId, scope.locationSlug);
    if (!location) throw new NotFoundError();
    return location;
  }
}
