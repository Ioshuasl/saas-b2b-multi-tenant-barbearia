import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { inLocationScope } from '../../helpers/location_scope.js';
import type { LocationServiceUpsertSchema } from '../../schemas/service.schema.js';
import type { GetRepository as GetLocationRepository } from '../../repositories/location/location_get.repository.js';
import type { GetRepository as GetServiceRepository } from '../../repositories/service/service_get.repository.js';
import type { UpsertLocationRepository } from '../../repositories/service/service_upsert_location.repository.js';

export class UpsertLocationService {
  constructor(
    private readonly getLocation: GetLocationRepository,
    private readonly getService: GetServiceRepository,
    private readonly upsertRepository: UpsertLocationRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    locationId: string,
    serviceId: string,
    locationServiceSchema: LocationServiceUpsertSchema,
  ): Promise<void> {
    const location = await this.getLocation.execute(ctx, locationId);
    if (!location || !inLocationScope(ctx.locationScope, ctx.locationIds, locationId)) {
      throw new NotFoundError();
    }
    const service = await this.getService.execute(ctx, serviceId);
    if (!service) throw new NotFoundError();
    await this.upsertRepository.execute(ctx, locationId, serviceId, locationServiceSchema);
  }
}
