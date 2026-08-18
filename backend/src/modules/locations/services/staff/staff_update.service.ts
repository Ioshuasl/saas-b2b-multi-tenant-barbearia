import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { inLocationScope } from '../../helpers/location_scope.js';
import type { StaffUpdateSchema } from '../../schemas/staff.schema.js';
import type { StaffSummary } from '../../types/staff/staff.types.js';
import type { GetRepository } from '../../repositories/staff/staff_get.repository.js';
import type { UpdateRepository } from '../../repositories/staff/staff_update.repository.js';
import type { AssertRepository } from '../../repositories/location/location_assert.repository.js';

export class UpdateService {
  constructor(
    private readonly getRepository: GetRepository,
    private readonly assertLocations: AssertRepository,
    private readonly updateRepository: UpdateRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    staffId: string,
    staffSchema: StaffUpdateSchema,
  ): Promise<StaffSummary> {
    const current = await this.getRepository.execute(ctx, staffId);
    if (!current) throw new NotFoundError();
    if (!staffVisible(ctx, current.locationIds)) throw new NotFoundError();

    if (staffSchema.homeLocationId) {
      if (!inLocationScope(ctx.locationScope, ctx.locationIds, staffSchema.homeLocationId)) {
        throw new NotFoundError();
      }
      await this.assertLocations.execute(ctx, [staffSchema.homeLocationId]);
    }

    const updated = await this.updateRepository.execute(ctx, staffId, staffSchema);
    if (!updated) throw new NotFoundError();
    return updated;
  }
}

function staffVisible(ctx: RequestContext, locationIds: string[]): boolean {
  if (ctx.locationScope === 'ALL') return true;
  return locationIds.some((id) => ctx.locationIds.includes(id));
}
