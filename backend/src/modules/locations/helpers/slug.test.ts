import { describe, expect, it } from 'vitest';
import { isReservedSlug, slugifyName } from './slug.js';

describe('location slug', () => {
  it('reserva slugs das rotas Next', () => {
    expect(isReservedSlug('agendamento')).toBe(true);
    expect(isReservedSlug('configuracoes')).toBe(true);
    expect(isReservedSlug('centro')).toBe(false);
  });

  it('prefixa unidade cujo slug colide', () => {
    expect(slugifyName('Agendamento')).toBe('unidade-agendamento');
  });
});
