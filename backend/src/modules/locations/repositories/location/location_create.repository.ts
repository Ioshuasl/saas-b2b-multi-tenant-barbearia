import { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { DEFAULT_HOUR_WEEKDAYS, defaultHourRange } from '../../helpers/default_hours.js';
import { DuplicateSlugError } from '../../models/errors/duplicate_slug.error.js';
import { suggestSlug } from '../../helpers/slug.js';
import type { LocationCreateSchema } from '../../schemas/location.schema.js';
import type { LocationSummary } from '../../types/location/location.types.js';
import { toLocationSummary } from './location.mapper.js';

export class CreateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    locationSchema: LocationCreateSchema & { slug: string; timezone: string },
  ): Promise<LocationSummary> {
    try {
      return await this.db.runInTenantContext(ctx, async (tx) => {
        const created = await tx.location.create({
          data: {
            id: idGenerator.next(),
            tenantId: ctx.tenantId,
            slug: locationSchema.slug,
            name: locationSchema.name,
            timezone: locationSchema.timezone,
            phone: locationSchema.phone,
            email: locationSchema.email,
            address: locationSchema.address,
            coverUrl: locationSchema.coverUrl,
            bookingLeadTimeMinutes: locationSchema.bookingLeadTimeMinutes,
            bookingHorizonDays: locationSchema.bookingHorizonDays,
            cancelDeadlineHours: locationSchema.cancelDeadlineHours,
            acceptsOnlineBooking: locationSchema.acceptsOnlineBooking,
            isDefault: false,
          },
        });

        const range = defaultHourRange();
        for (const weekday of DEFAULT_HOUR_WEEKDAYS) {
          await tx.businessHours.create({
            data: {
              id: idGenerator.next(),
              tenantId: ctx.tenantId,
              locationId: created.id,
              weekday,
              startsAt: range.startsAt,
              endsAt: range.endsAt,
            },
          });
        }

        return toLocationSummary(created);
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new DuplicateSlugError(suggestSlug(locationSchema.slug));
      }
      throw err;
    }
  }
}
