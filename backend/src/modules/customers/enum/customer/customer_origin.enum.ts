export const CustomerOrigin = {
  PUBLIC_PAGE: 'PUBLIC_PAGE',
  PANEL: 'PANEL',
  PHONE: 'PHONE',
  WALKIN: 'WALKIN',
} as const;

export type CustomerOriginName = (typeof CustomerOrigin)[keyof typeof CustomerOrigin];

export const CUSTOMER_ORIGINS = Object.values(CustomerOrigin) as CustomerOriginName[];
