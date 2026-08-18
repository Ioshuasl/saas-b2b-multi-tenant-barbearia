import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';
import type { RefreshTokenFamily } from '../../models/refresh_token_family.model.js';
import {
  toRefreshTokenFamily,
  type RefreshLookupRow,
} from './mappers/refresh_token.mapper.js';

export class GetByHashRepository {
  constructor(private readonly prisma = getPrismaClient()) {}

  async execute(tokenHash: string): Promise<RefreshTokenFamily | null> {
    const rows = await this.prisma.$queryRaw<RefreshLookupRow[]>(
      Prisma.sql`SELECT * FROM platform.lookup_refresh_by_token_hash(${tokenHash})`,
    );
    const row = rows[0];
    return row ? toRefreshTokenFamily(row) : null;
  }
}
