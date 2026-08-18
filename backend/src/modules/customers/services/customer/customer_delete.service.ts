import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { RequestMeta } from '../../types/request_meta.types.js';
import type { DeactivateRepository } from '../../repositories/customer/customer_deactivate.repository.js';

export class DeleteService {
  constructor(private readonly deactivateRepository: DeactivateRepository) {}

  async execute(
    ctx: RequestContext,
    customerId: string,
    requestMeta: RequestMeta,
  ): Promise<void> {
    const ok = await this.deactivateRepository.execute(ctx, customerId);
    if (!ok) throw new NotFoundError();

    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: AuditAction.CUSTOMER_DEACTIVATED,
      resourceType: 'customer',
      resourceId: customerId,
      customerId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });
  }
}
