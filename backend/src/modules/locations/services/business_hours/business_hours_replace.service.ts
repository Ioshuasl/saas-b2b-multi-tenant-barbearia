import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { inLocationScope } from '../../helpers/location_scope.js';
import { assertHoursRange } from '../../models/business_hours.model.js';
import type { BusinessHoursReplaceSchema } from '../../schemas/business_hours.schema.js';
import type { BusinessHoursView } from '../../types/business_hours/business_hours.types.js';
import type { GetRepository as GetLocationRepository } from '../../repositories/location/location_get.repository.js';
import type { GetRepository as GetStaffRepository } from '../../repositories/staff/staff_get.repository.js';
import type { ReplaceRepository } from '../../repositories/business_hours/business_hours_replace.repository.js';

export class ReplaceService {
  constructor(
    private readonly getLocation: GetLocationRepository,
    private readonly getStaff: GetStaffRepository,
    private readonly replaceRepository: ReplaceRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    businessHoursSchema: BusinessHoursReplaceSchema,
  ): Promise<BusinessHoursView> {
    const location = await this.getLocation.execute(ctx, businessHoursSchema.locationId);
    if (
      !location ||
      !inLocationScope(ctx.locationScope, ctx.locationIds, businessHoursSchema.locationId)
    ) {
      throw new NotFoundError();
    }
    if (businessHoursSchema.staffId) {
      const staff = await this.getStaff.execute(ctx, businessHoursSchema.staffId);
      if (!staff) throw new NotFoundError();
    }
    for (const slot of businessHoursSchema.slots) {
      assertHoursRange(slot.startsAt, slot.endsAt);
    }
    return this.replaceRepository.execute(
      ctx,
      businessHoursSchema.locationId,
      businessHoursSchema.staffId ?? null,
      businessHoursSchema.slots,
    );
  }
}
