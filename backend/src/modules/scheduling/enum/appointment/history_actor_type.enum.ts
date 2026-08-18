export const HistoryActorType = {
  USER: 'USER',
  CUSTOMER: 'CUSTOMER',
  SYSTEM: 'SYSTEM',
} as const;

export type HistoryActorTypeName = (typeof HistoryActorType)[keyof typeof HistoryActorType];
