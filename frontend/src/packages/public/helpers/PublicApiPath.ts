export function publicTenantPath(tenantSlug: string): string {
  return `/public/${encodeURIComponent(tenantSlug)}`;
}

export function publicLocationPath(tenantSlug: string, locationSlug: string): string {
  return `${publicTenantPath(tenantSlug)}/${encodeURIComponent(locationSlug)}`;
}

export function publicAppointmentPath(
  tenantSlug: string,
  locationSlug: string,
  appointmentId: string,
): string {
  return `${publicLocationPath(tenantSlug, locationSlug)}/appointments/${encodeURIComponent(appointmentId)}`;
}
