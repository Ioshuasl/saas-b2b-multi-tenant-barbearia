import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/domain/errors.js';
import { DuplicateSlugError } from '../../models/errors/duplicate_slug.error.js';
import { isIanaTimeZone } from '../../helpers/timezone.js';
import { isReservedSlug, slugifyName, suggestSlug } from '../../helpers/slug.js';
import type { LocationCreateSchema } from '../../schemas/location.schema.js';
import type { LocationSummary } from '../../types/location/location.types.js';
import type { PlanLimitPort } from '../../types/ports/plan_limit.port.js';
import type { CreateRepository } from '../../repositories/location/location_create.repository.js';
import type { GetBySlugRepository } from '../../repositories/location/location_get_by_slug.repository.js';

export class CreateService {
  constructor(
    private readonly planLimit: PlanLimitPort,
    private readonly getBySlug: GetBySlugRepository,
    private readonly createRepository: CreateRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    locationSchema: LocationCreateSchema,
  ): Promise<LocationSummary> {
    const timezone = locationSchema.timezone ?? 'America/Sao_Paulo';
    if (!isIanaTimeZone(timezone)) {
      throw new AppError('VALIDATION_ERROR', 'Timezone IANA inválido.', 400);
    }
    await this.planLimit.assertCanCreate(ctx.tenantId, 'location');

    const base = locationSchema.slug ?? slugifyName(locationSchema.name);
    if (isReservedSlug(base)) {
      throw new DuplicateSlugError(suggestSlug(base));
    }
    const taken = await this.getBySlug.execute(ctx, base);
    if (taken) {
      throw new DuplicateSlugError(suggestSlug(base));
    }

    return this.createRepository.execute(ctx, {
      ...locationSchema,
      timezone,
      slug: base,
    });
  }
}
