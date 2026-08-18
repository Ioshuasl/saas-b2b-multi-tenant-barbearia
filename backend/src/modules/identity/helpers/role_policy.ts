import { UserRole, type UserRoleName } from '../enum/user/user_role.enum.js';

export function canAssignRole(actorRole: string, targetRole: UserRoleName): boolean {
  if (actorRole === UserRole.OWNER) return true;
  return targetRole !== UserRole.OWNER;
}

export function requiresLocations(role: UserRoleName): boolean {
  return role !== UserRole.OWNER;
}
