import type { UserRoleName } from '../enum/user/user_role.enum.js';

export type InvitationProps = {
  id: string;
  tenantId: string;
  email: string;
  role: UserRoleName;
  locationIds: string[];
  tokenHash: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  invitedBy: string;
};

export class Invitation {
  constructor(readonly props: InvitationProps) {}

  get isAccepted(): boolean {
    return this.props.acceptedAt !== null;
  }

  get isExpired(): boolean {
    return this.props.expiresAt.getTime() <= Date.now();
  }

  get isUsable(): boolean {
    return !this.isAccepted && !this.isExpired;
  }
}
