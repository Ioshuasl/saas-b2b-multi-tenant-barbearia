import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { inLocationScope } from '../../helpers/location_scope.js';
import type { StaffLocationsSchema } from '../../schemas/staff.schema.js';
import type { GetRepository } from '../../repositories/staff/staff_get.repository.js';
import type { ReplaceLocationsRepository } from '../../repositories/staff/staff_replace_locations.repository.js';
import type { AssertRepository } from '../../repositories/location/location_assert.repository.js';

export class ReplaceLocationsService {
  constructor(
    private readonly getRepository: GetRepository,
    private readonly assertLocations: AssertRepository,
    private readonly replaceRepository: ReplaceLocationsRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    staffId: string,
    staffLocationsSchema: StaffLocationsSchema,
  ): Promise<void> {
    const current = await this.getRepository.execute(ctx, staffId);
    if (!current) throw new NotFoundError();

    const locationIds = uniqueIds([current.homeLocationId, ...staffLocationsSchema.locationIds]);
    for (const locationId of locationIds) {
      if (!inLocationScope(ctx.locationScope, ctx.locationIds, locationId)) {
        throw new NotFoundError();
      }
    }
    await this.assertLocations.execute(ctx, locationIds);
    await this.replaceRepository.execute(ctx, staffId, locationIds);
  }
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}
