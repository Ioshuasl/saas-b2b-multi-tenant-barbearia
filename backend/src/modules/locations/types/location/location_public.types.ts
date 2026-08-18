import type { LocationAddress } from './location.types.js';

export type PublicStaffCard = {
  id: string;
  name: string;
};

export type PublicLocationCard = {
  id: string;
  slug: string;
  name: string;
  address: LocationAddress | null;
  latitude: number | null;
  longitude: number | null;
  bookingAvailable: boolean;
};

export type PublicLocationDetail = PublicLocationCard & {
  timezone: string;
  phone: string | null;
  services: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
  }>;
  staff: PublicStaffCard[];
};

export type PublicTenantPayload = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  locations: PublicLocationCard[];
};
