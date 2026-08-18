export type RefreshTokenProps = {
  id: string;
  tenantId: string;
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  revokedAt: Date | null;
};

export class RefreshTokenFamily {
  constructor(readonly props: RefreshTokenProps) {}

  get isExpired(): boolean {
    return this.props.expiresAt.getTime() <= Date.now();
  }

  get isConsumed(): boolean {
    return this.props.consumedAt !== null;
  }

  get isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }

  /** Token já usado ou família revogada — apresentar de novo é reuso. */
  get isReuse(): boolean {
    return this.isConsumed || this.isRevoked;
  }

  get isUsable(): boolean {
    return !this.isExpired && !this.isConsumed && !this.isRevoked;
  }
}
