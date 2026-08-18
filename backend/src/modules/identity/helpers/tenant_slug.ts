export const RESERVED_TENANT_SLUGS = [
  'admin',
  'api',
  'app',
  'login',
  'signup',
  'health',
  'agenda',
  'clientes',
  'inicio',
  'configuracoes',
  'forgot-password',
  'reset-password',
  'verify-email',
  'accept-invite',
  'agendamento',
] as const;

export function slugifyTenantName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  if (!slug || isReservedTenantSlug(slug)) {
    return `rede-${slug || 'barbearia'}`.slice(0, 48);
  }
  return slug;
}

export function isReservedTenantSlug(slug: string): boolean {
  return (RESERVED_TENANT_SLUGS as readonly string[]).includes(slug);
}

export function withSlugSuffix(base: string, suffix: string): string {
  const trimmed = base.slice(0, Math.max(8, 48 - suffix.length - 1));
  return `${trimmed}-${suffix}`;
}
