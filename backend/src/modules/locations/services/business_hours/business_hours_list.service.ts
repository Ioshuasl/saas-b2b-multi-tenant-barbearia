import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { inLocationScope } from '../../helpers/location_scope.js';
import type { BusinessHoursView } from '../../types/business_hours/business_hours.types.js';
import type { GetRepository as GetLocationRepository } from '../../repositories/location/location_get.repository.js';
import type { ListRepository } from '../../repositories/business_hours/business_hours_list.repository.js';

export class ListService {
  constructor(
    private readonly getLocation: GetLocationRepository,
    private readonly listRepository: ListRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    locationId: string,
    staffId: string | null,
  ): Promise<BusinessHoursView> {
    const location = await this.getLocation.execute(ctx, locationId);
    if (!location || !inLocationScope(ctx.locationScope, ctx.locationIds, locationId)) {
      throw new NotFoundError();
    }
    return this.listRepository.execute(ctx, locationId, staffId);
  }
}
