import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';
import type { Invitation } from '../../models/invitation.model.js';
import { toInvitation, type InvitationRow } from './mappers/invitation.mapper.js';

export class GetByHashRepository {
  constructor(private readonly prisma = getPrismaClient()) {}

  async execute(tokenHash: string): Promise<Invitation | null> {
    const rows = await this.prisma.$queryRaw<InvitationRow[]>(
      Prisma.sql`SELECT * FROM platform.lookup_invitation_by_token_hash(${tokenHash})`,
    );
    const row = rows[0];
    return row ? toInvitation(row) : null;
  }
}
