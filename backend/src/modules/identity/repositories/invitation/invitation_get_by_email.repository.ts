import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { Invitation } from '../../models/invitation.model.js';
import { toInvitation } from './mappers/invitation.mapper.js';

export class GetByEmailRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, email: string): Promise<Invitation | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.invitation.findFirst({
        where: { email, acceptedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      return row ? toInvitation(row) : null;
    });
  }
}
