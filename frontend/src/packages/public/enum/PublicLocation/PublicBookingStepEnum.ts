export const PublicBookingStep = {
  SERVICE: 'service',
  STAFF: 'staff',
  SLOT: 'slot',
  CUSTOMER: 'customer',
  CONFIRM: 'confirm',
} as const;

export type PublicBookingStepName = (typeof PublicBookingStep)[keyof typeof PublicBookingStep];
