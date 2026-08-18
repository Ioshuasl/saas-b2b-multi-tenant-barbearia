import { describe, expect, it } from 'vitest';
import { isReservedTenantSlug, slugifyTenantName } from './tenant_slug.js';

describe('tenant_slug', () => {
  it('reserva slugs das rotas Next', () => {
    expect(isReservedTenantSlug('agenda')).toBe(true);
    expect(isReservedTenantSlug('clientes')).toBe(true);
    expect(isReservedTenantSlug('login')).toBe(true);
    expect(isReservedTenantSlug('agendamento')).toBe(true);
    expect(isReservedTenantSlug('navalha')).toBe(false);
  });

  it('prefixa nome que colide com rota reservada', () => {
    expect(slugifyTenantName('Agenda')).toBe('rede-agenda');
  });
});
