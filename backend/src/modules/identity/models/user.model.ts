import { UserRole, type UserRoleName } from '../enum/user/user_role.enum.js';
import { UserStatus, type UserStatusName } from '../enum/user/user_status.enum.js';

export type UserProps = {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  role: UserRoleName;
  status: UserStatusName;
  lockedUntil: Date | null;
  failedAttempts: number;
};

export class User {
  constructor(readonly props: UserProps) {}

  get isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  get isLocked(): boolean {
    return this.props.lockedUntil !== null && this.props.lockedUntil.getTime() > Date.now();
  }

  get isOwner(): boolean {
    return this.props.role === UserRole.OWNER;
  }

  canAuthenticate(): boolean {
    return this.isActive && !this.isLocked;
  }
}
