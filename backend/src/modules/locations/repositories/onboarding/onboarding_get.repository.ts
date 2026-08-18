import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export type OnboardingRecord = {
  onboarding: unknown;
  tenantSlug: string;
  defaultLocationSlug: string | null;
};

export class GetRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext): Promise<OnboardingRecord | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: { slug: true, onboarding: true },
      });
      if (!tenant) return null;
      const location = await tx.location.findFirst({
        where: { isDefault: true },
        select: { slug: true },
      });
      return {
        onboarding: tenant.onboarding,
        tenantSlug: tenant.slug,
        defaultLocationSlug: location?.slug ?? null,
      };
    });
  }
}
