import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { DuplicateSlugError } from '../../models/errors/duplicate_slug.error.js';
import { isReservedSlug, suggestSlug } from '../../helpers/slug.js';
import type { TenantUpdateSchema } from '../../schemas/tenant.schema.js';
import type { TenantSummary } from '../../types/tenant/tenant.types.js';
import type { UpdateRepository } from '../../repositories/tenant/tenant_update.repository.js';
import type { SlugAvailableRepository } from '../../repositories/tenant/tenant_slug_available.repository.js';

export class UpdateService {
  constructor(
    private readonly slugAvailable: SlugAvailableRepository,
    private readonly updateRepository: UpdateRepository,
  ) {}

  async execute(ctx: RequestContext, tenantSchema: TenantUpdateSchema): Promise<TenantSummary> {
    if (tenantSchema.slug) {
      if (isReservedSlug(tenantSchema.slug)) {
        throw new DuplicateSlugError(suggestSlug(tenantSchema.slug));
      }
      const available = await this.slugAvailable.execute(ctx, tenantSchema.slug);
      if (!available) throw new DuplicateSlugError(suggestSlug(tenantSchema.slug));
    }

    const updated = await this.updateRepository.execute(ctx, tenantSchema);
    if (!updated) throw new NotFoundError();

    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: AuditAction.TENANT_UPDATED,
      resourceType: 'tenant',
      resourceId: ctx.tenantId,
      metadata: { fields: Object.keys(tenantSchema) },
    });
    return updated;
  }
}
