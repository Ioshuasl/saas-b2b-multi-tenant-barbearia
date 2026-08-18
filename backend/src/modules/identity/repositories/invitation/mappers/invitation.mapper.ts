import type { UserRoleName } from '../../../enum/user/user_role.enum.js';
import { Invitation } from '../../../models/invitation.model.js';

export type InvitationRow = {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  locationIds: string[];
  tokenHash: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  invitedBy: string;
  createdAt?: Date;
};

export function toInvitation(row: InvitationRow): Invitation {
  return new Invitation({
    id: row.id,
    tenantId: row.tenantId,
    email: row.email,
    role: row.role as UserRoleName,
    locationIds: Array.isArray(row.locationIds) ? row.locationIds.map(String) : [],
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    acceptedAt: row.acceptedAt,
    invitedBy: row.invitedBy,
  });
}
