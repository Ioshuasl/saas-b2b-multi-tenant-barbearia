export const TenantStatus = {
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  NEGOTIATING: 'NEGOTIATING',
  SUSPENDED: 'SUSPENDED',
  CANCELED: 'CANCELED',
} as const;

export type TenantStatusName = (typeof TenantStatus)[keyof typeof TenantStatus];
