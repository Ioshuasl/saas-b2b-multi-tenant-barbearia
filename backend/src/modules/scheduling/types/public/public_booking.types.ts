export type PublicAppointmentCreated = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  staff: { id: string; name: string };
  services: Array<{ name: string; durationMinutes: number; priceCents: number }>;
  totalPriceCents: number;
  cancelToken: string;
};

export type PublicAppointmentMasked = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  customer: { name: string; phoneMasked: string };
  staff: { id: string; name: string };
  services: Array<{ name: string; durationMinutes: number; priceCents: number }>;
  totalPriceCents: number;
};

export type PublicSlugScope = {
  tenantId: string;
  tenantSlug: string;
  locationId: string;
  locationSlug: string;
};
