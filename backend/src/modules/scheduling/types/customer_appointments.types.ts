export type CustomerAppointmentListItem = {
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

export type CustomerAppointmentListResult = {
  items: CustomerAppointmentListItem[];
  totalSpentCents: number;
};
