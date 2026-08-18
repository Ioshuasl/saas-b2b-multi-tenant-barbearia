export const CancelActor = {
  USER: 'USER',
  CUSTOMER: 'CUSTOMER',
  SYSTEM: 'SYSTEM',
} as const;

export type CancelActorName = (typeof CancelActor)[keyof typeof CancelActor];
