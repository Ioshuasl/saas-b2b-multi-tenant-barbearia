import type { UserRoleName } from '../../../enum/user/user_role.enum.js';
import type { UserStatusName } from '../../../enum/user/user_status.enum.js';
import { User } from '../../../models/user.model.js';

export type UserLookupRow = {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  lockedUntil: Date | null;
  failedAttempts: number;
  tenantSlug?: string;
};

export function toUser(row: UserLookupRow): User {
  return new User({
    id: row.id,
    tenantId: row.tenantId,
    email: row.email,
    passwordHash: row.passwordHash,
    name: row.name,
    phone: row.phone,
    role: row.role as UserRoleName,
    status: row.status as UserStatusName,
    lockedUntil: row.lockedUntil,
    failedAttempts: Number(row.failedAttempts),
  });
}
