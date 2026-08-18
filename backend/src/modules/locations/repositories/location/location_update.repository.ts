import { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { DuplicateSlugError } from '../../models/errors/duplicate_slug.error.js';
import { suggestSlug } from '../../helpers/slug.js';
import type { LocationUpdateSchema } from '../../schemas/location.schema.js';
import type { LocationSummary } from '../../types/location/location.types.js';
import { toLocationSummary } from './location.mapper.js';

const SLUG_HISTORY_MS = 30 * 24 * 60 * 60 * 1000;

export class UpdateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    locationId: string,
    locationSchema: LocationUpdateSchema,
  ): Promise<LocationSummary | null> {
    try {
      return await this.db.runInTenantContext(ctx, async (tx) => {
      const current = await tx.location.findUnique({ where: { id: locationId } });
      if (!current) return null;

      if (locationSchema.isDefault === true && !current.isDefault) {
        await tx.location.updateMany({
          where: { isDefault: true, id: { not: locationId } },
          data: { isDefault: false },
        });
      }

      if (locationSchema.slug && locationSchema.slug !== current.slug) {
        await tx.locationSlugHistory.upsert({
          where: {
            tenantId_slug: { tenantId: ctx.tenantId, slug: current.slug },
          },
          create: {
            tenantId: ctx.tenantId,
            slug: current.slug,
            locationId,
            expiresAt: new Date(Date.now() + SLUG_HISTORY_MS),
          },
          update: {
            locationId,
            expiresAt: new Date(Date.now() + SLUG_HISTORY_MS),
          },
        });
      }

      const updated = await tx.location.update({
        where: { id: locationId },
        data: {
          name: locationSchema.name,
          slug: locationSchema.slug,
          timezone: locationSchema.timezone,
          phone: locationSchema.phone,
          email: locationSchema.email,
          address:
            locationSchema.address === undefined
              ? undefined
              : locationSchema.address === null
                ? Prisma.JsonNull
                : (locationSchema.address as Prisma.InputJsonValue),
          coverUrl: locationSchema.coverUrl,
          bookingLeadTimeMinutes: locationSchema.bookingLeadTimeMinutes,
          bookingHorizonDays: locationSchema.bookingHorizonDays,
          cancelDeadlineHours: locationSchema.cancelDeadlineHours,
          acceptsOnlineBooking: locationSchema.acceptsOnlineBooking,
          isDefault: locationSchema.isDefault,
          active: locationSchema.active,
        },
      });
      return toLocationSummary(updated);
    });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new DuplicateSlugError(suggestSlug(locationSchema.slug ?? locationId));
      }
      throw err;
    }
  }
}
