import { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { DuplicateSlugError } from '../../models/errors/duplicate_slug.error.js';
import { suggestSlug } from '../../helpers/slug.js';
import type { TenantUpdateSchema } from '../../schemas/tenant.schema.js';
import type { TenantSummary } from '../../types/tenant/tenant.types.js';
import { toTenantSummary } from './mappers/tenant.mapper.js';

const SLUG_HISTORY_MS = 30 * 24 * 60 * 60 * 1000;

export class UpdateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, tenantSchema: TenantUpdateSchema): Promise<TenantSummary | null> {
    try {
      return await this.db.runInTenantContext(ctx, async (tx) => {
      const current = await tx.tenant.findUnique({ where: { id: ctx.tenantId } });
      if (!current) return null;

      if (tenantSchema.slug && tenantSchema.slug !== current.slug) {
        await tx.tenantSlugHistory.upsert({
          where: { slug: current.slug },
          create: {
            slug: current.slug,
            tenantId: ctx.tenantId,
            expiresAt: new Date(Date.now() + SLUG_HISTORY_MS),
          },
          update: {
            tenantId: ctx.tenantId,
            expiresAt: new Date(Date.now() + SLUG_HISTORY_MS),
          },
        });
      }

      const updated = await tx.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          name: tenantSchema.name,
          slug: tenantSchema.slug,
          logoUrl: tenantSchema.logoUrl,
          brandColor: tenantSchema.brandColor,
        },
      });
      return toTenantSummary(updated);
    });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new DuplicateSlugError(suggestSlug(tenantSchema.slug ?? ''));
      }
      throw err;
    }
  }
}
