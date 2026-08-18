import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { GetRepository } from '../../repositories/location/location_get.repository.js';
import type { LocationSummary } from '../../types/location/location_get.types.js';

export class GetService {
  constructor(private readonly getRepository: GetRepository) {}

  async execute(ctx: RequestContext, locationId: string): Promise<LocationSummary> {
    const location = await this.getRepository.execute(ctx, locationId);
    if (!location) {
      throw new NotFoundError();
    }
    if (ctx.locationScope !== 'ALL' && !ctx.locationIds.includes(location.id)) {
      throw new NotFoundError();
    }
    return location;
  }
}
