export const UserStatus = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
} as const;

export type UserStatusName = (typeof UserStatus)[keyof typeof UserStatus];
