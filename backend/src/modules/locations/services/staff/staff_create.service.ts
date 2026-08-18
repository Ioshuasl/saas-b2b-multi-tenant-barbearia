import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { inLocationScope } from '../../helpers/location_scope.js';
import type { StaffCreateSchema } from '../../schemas/staff.schema.js';
import type { StaffSummary } from '../../types/staff/staff.types.js';
import type { PlanLimitPort } from '../../types/ports/plan_limit.port.js';
import type { CreateRepository } from '../../repositories/staff/staff_create.repository.js';
import type { AssertRepository } from '../../repositories/location/location_assert.repository.js';

export class CreateService {
  constructor(
    private readonly planLimit: PlanLimitPort,
    private readonly assertLocations: AssertRepository,
    private readonly createRepository: CreateRepository,
  ) {}

  async execute(ctx: RequestContext, staffSchema: StaffCreateSchema): Promise<StaffSummary> {
    const locationIds = uniqueIds([
      staffSchema.homeLocationId,
      ...(staffSchema.locationIds ?? []),
    ]);
    for (const locationId of locationIds) {
      if (!inLocationScope(ctx.locationScope, ctx.locationIds, locationId)) {
        throw new NotFoundError();
      }
    }
    await this.assertLocations.execute(ctx, locationIds);
    await this.planLimit.assertCanCreate(ctx.tenantId, 'staff');
    return this.createRepository.execute(ctx, staffSchema, locationIds);
  }
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}
