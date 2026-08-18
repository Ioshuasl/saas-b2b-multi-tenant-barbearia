import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError, NotFoundError } from '../../../../shared/domain/errors.js';
import { DuplicateSlugError } from '../../models/errors/duplicate_slug.error.js';
import { assertCanChangeDefault } from '../../models/location.model.js';
import { isIanaTimeZone } from '../../helpers/timezone.js';
import { inLocationScope } from '../../helpers/location_scope.js';
import { isReservedSlug, suggestSlug } from '../../helpers/slug.js';
import type { LocationUpdateSchema } from '../../schemas/location.schema.js';
import type { LocationSummary } from '../../types/location/location.types.js';
import type { GetRepository } from '../../repositories/location/location_get.repository.js';
import type { GetBySlugRepository } from '../../repositories/location/location_get_by_slug.repository.js';
import type { UpdateRepository } from '../../repositories/location/location_update.repository.js';

export class UpdateService {
  constructor(
    private readonly getRepository: GetRepository,
    private readonly getBySlug: GetBySlugRepository,
    private readonly updateRepository: UpdateRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    locationId: string,
    locationSchema: LocationUpdateSchema,
  ): Promise<LocationSummary> {
    const current = await this.getRepository.execute(ctx, locationId);
    if (!current) throw new NotFoundError();
    if (!inLocationScope(ctx.locationScope, ctx.locationIds, current.id)) {
      throw new NotFoundError();
    }

    if (locationSchema.timezone && !isIanaTimeZone(locationSchema.timezone)) {
      throw new AppError('VALIDATION_ERROR', 'Timezone IANA inválido.', 400);
    }

    assertCanChangeDefault({
      makingDefault: locationSchema.isDefault === true,
      unsettingDefault: locationSchema.isDefault === false && current.isDefault,
      deactivatingDefault: locationSchema.active === false && current.isDefault,
    });

    if (locationSchema.slug) {
      if (isReservedSlug(locationSchema.slug)) {
        throw new DuplicateSlugError(suggestSlug(locationSchema.slug));
      }
      const taken = await this.getBySlug.execute(ctx, locationSchema.slug, locationId);
      if (taken) throw new DuplicateSlugError(suggestSlug(locationSchema.slug));
    }

    const updated = await this.updateRepository.execute(ctx, locationId, locationSchema);
    if (!updated) throw new NotFoundError();
    return updated;
  }
}
