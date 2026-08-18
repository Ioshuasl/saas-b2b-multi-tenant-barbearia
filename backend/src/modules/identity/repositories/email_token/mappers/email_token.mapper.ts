import type { EmailTokenPurposeName } from '../../../enum/auth/email_token_purpose.enum.js';
import { EmailToken } from '../../../models/email_token.model.js';

export type EmailTokenRow = {
  id: string;
  tenantId: string;
  userId: string;
  purpose: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
};

export function toEmailToken(row: EmailTokenRow): EmailToken {
  return new EmailToken({
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    purpose: row.purpose as EmailTokenPurposeName,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    consumedAt: row.consumedAt,
  });
}
