import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { inLocationScope } from '../../helpers/location_scope.js';
import { assertTimeBlockRange } from '../../models/time_block.model.js';
import type { TimeBlockCreateSchema } from '../../schemas/time_block.schema.js';
import type { TimeBlockSummary } from '../../types/time_block/time_block.types.js';
import type { GetRepository as GetLocationRepository } from '../../repositories/location/location_get.repository.js';
import type { GetRepository as GetStaffRepository } from '../../repositories/staff/staff_get.repository.js';
import type { CreateRepository } from '../../repositories/time_block/time_block_create.repository.js';

export class CreateService {
  constructor(
    private readonly getLocation: GetLocationRepository,
    private readonly getStaff: GetStaffRepository,
    private readonly createRepository: CreateRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    timeBlockSchema: TimeBlockCreateSchema,
  ): Promise<TimeBlockSummary> {
    const location = await this.getLocation.execute(ctx, timeBlockSchema.locationId);
    if (
      !location ||
      !inLocationScope(ctx.locationScope, ctx.locationIds, timeBlockSchema.locationId)
    ) {
      throw new NotFoundError();
    }
    if (timeBlockSchema.staffId) {
      const staff = await this.getStaff.execute(ctx, timeBlockSchema.staffId);
      if (!staff) throw new NotFoundError();
    }
    assertTimeBlockRange(new Date(timeBlockSchema.startsAt), new Date(timeBlockSchema.endsAt));
    return this.createRepository.execute(ctx, timeBlockSchema);
  }
}
