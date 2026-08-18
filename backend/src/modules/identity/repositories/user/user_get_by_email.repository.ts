import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';
import type { User } from '../../models/user.model.js';
import { toUser, type UserLookupRow } from './mappers/user.mapper.js';

export type UserByEmail = {
  user: User;
  tenantSlug: string;
};

export class GetByEmailRepository {
  constructor(private readonly prisma = getPrismaClient()) {}

  async execute(email: string): Promise<UserByEmail | null> {
    const rows = await this.prisma.$queryRaw<UserLookupRow[]>(
      Prisma.sql`SELECT * FROM platform.lookup_user_by_email(${email}::citext)`,
    );
    const row = rows[0];
    if (!row) return null;
    return { user: toUser(row), tenantSlug: String(row.tenantSlug ?? '') };
  }
}
