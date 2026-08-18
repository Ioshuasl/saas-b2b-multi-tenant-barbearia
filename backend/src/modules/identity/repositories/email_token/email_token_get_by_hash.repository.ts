import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';
import type { EmailToken } from '../../models/email_token.model.js';
import { toEmailToken, type EmailTokenRow } from './mappers/email_token.mapper.js';

export class GetByHashRepository {
  constructor(private readonly prisma = getPrismaClient()) {}

  async execute(tokenHash: string): Promise<EmailToken | null> {
    const rows = await this.prisma.$queryRaw<EmailTokenRow[]>(
      Prisma.sql`SELECT * FROM platform.lookup_email_token_by_hash(${tokenHash})`,
    );
    const row = rows[0];
    return row ? toEmailToken(row) : null;
  }
}
