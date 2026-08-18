import type { EmailTokenPurposeName } from '../enum/auth/email_token_purpose.enum.js';

export type EmailTokenProps = {
  id: string;
  tenantId: string;
  userId: string;
  purpose: EmailTokenPurposeName;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
};

export class EmailToken {
  constructor(readonly props: EmailTokenProps) {}

  get isConsumed(): boolean {
    return this.props.consumedAt !== null;
  }

  get isExpired(): boolean {
    return this.props.expiresAt.getTime() <= Date.now();
  }

  get isUsable(): boolean {
    return !this.isConsumed && !this.isExpired;
  }
}
