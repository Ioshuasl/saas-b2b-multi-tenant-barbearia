export const RESERVED_SLUGS = [
  'admin',
  'api',
  'app',
  'login',
  'signup',
  'health',
] as const;

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug);
}

export function slugifyName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  if (!slug || isReservedSlug(slug)) {
    return `unidade-${slug || 'loja'}`.slice(0, 48);
  }
  return slug;
}

export function withSlugSuffix(base: string, suffix: string): string {
  const trimmed = base.slice(0, Math.max(8, 48 - suffix.length - 1));
  return `${trimmed}-${suffix}`;
}

export function suggestSlug(base: string): string {
  return withSlugSuffix(base, Math.random().toString(36).slice(2, 6));
}
