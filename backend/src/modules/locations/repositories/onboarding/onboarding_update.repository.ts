import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { OnboardingRecord } from './onboarding_get.repository.js';

export class UpdateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    payload: { completedSteps: string[]; publishedAt: string | null },
  ): Promise<OnboardingRecord | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const tenant = await tx.tenant.update({
        where: { id: ctx.tenantId },
        data: { onboarding: payload },
        select: { slug: true, onboarding: true },
      });
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
