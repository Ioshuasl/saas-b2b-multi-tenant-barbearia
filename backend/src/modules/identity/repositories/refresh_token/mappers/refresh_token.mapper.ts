import { RefreshTokenFamily } from '../../../models/refresh_token_family.model.js';

export type RefreshLookupRow = {
  id: string;
  tenantId: string;
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  revokedAt: Date | null;
};

export function toRefreshTokenFamily(row: RefreshLookupRow): RefreshTokenFamily {
  return new RefreshTokenFamily({
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    familyId: row.familyId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    consumedAt: row.consumedAt,
    revokedAt: row.revokedAt,
  });
}
