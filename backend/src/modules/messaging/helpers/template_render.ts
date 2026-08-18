export function renderTemplate(body: string, variables: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '');
}

export function formatLocalDateTime(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function buildCancelLink(input: {
  appPublicUrl: string;
  tenantSlug: string;
  locationSlug: string;
  cancelLink?: string;
}): string {
  if (input.cancelLink) return input.cancelLink;
  const base = input.appPublicUrl.replace(/\/$/, '');
  return `${base}/public/${input.tenantSlug}/${input.locationSlug}`;
}

export function buildTemplateVariables(input: {
  customerName: string;
  locationName: string;
  startsAt: string;
  timezone: string;
  cancelLink: string;
}): Record<string, string> {
  return {
    customerName: input.customerName,
    locationName: input.locationName,
    startsAtLocal: formatLocalDateTime(input.startsAt, input.timezone),
    cancelLink: input.cancelLink,
  };
}
