export const UserRole = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  RECEPTIONIST: 'RECEPTIONIST',
} as const;

export type UserRoleName = (typeof UserRole)[keyof typeof UserRole];
