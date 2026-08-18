import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { Invitation } from '../../models/invitation.model.js';
import { toInvitation } from './mappers/invitation.mapper.js';

export class GetRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, invitationId: string): Promise<Invitation | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.invitation.findUnique({ where: { id: invitationId } });
      return row ? toInvitation(row) : null;
    });
  }
}
