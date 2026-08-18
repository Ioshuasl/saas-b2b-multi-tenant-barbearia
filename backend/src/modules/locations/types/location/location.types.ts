export type LocationAddress = {
  zip?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
};

export type LocationSummary = {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  timezone: string;
  phone: string | null;
  email: string | null;
  address: LocationAddress | null;
  coverUrl: string | null;
  bookingLeadTimeMinutes: number;
  bookingHorizonDays: number;
  cancelDeadlineHours: number;
  acceptsOnlineBooking: boolean;
  isDefault: boolean;
  active: boolean;
};
