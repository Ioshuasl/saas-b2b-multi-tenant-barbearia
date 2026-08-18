import type { CustomerOriginName } from '../../enum/customer/customer_origin.enum.js';

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  firstLocationId: string;
  marketingOptIn: boolean;
  origin: CustomerOriginName;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerDetail = CustomerSummary & {
  notes: string | null;
  birthdate: string | null;
};

export type CustomerDuplicateCheck = {
  exists: boolean;
  customerId?: string;
};

export type CustomerAppointmentHistoryItem = {
  id: string;
  locationId: string;
  locationName: string;
  staffId: string;
  staffName: string;
  startsAt: string;
  endsAt: string;
  status: string;
  totalPriceCents: number;
  services: Array<{ name: string; priceCents: number; durationMinutes: number }>;
};

export type CustomerAppointmentsResult = {
  items: CustomerAppointmentHistoryItem[];
  totalSpentCents: number;
};

export type UpsertByPhoneInput = {
  phone: string;
  name: string;
  email?: string;
  locationId: string;
  origin: CustomerOriginName;
  marketingOptIn?: boolean;
};

export type UpsertByPhoneResult = {
  id: string;
  created: boolean;
};

export type CustomerPublicSummary = {
  name: string;
  phone: string;
};
