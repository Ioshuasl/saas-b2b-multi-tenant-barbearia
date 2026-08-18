import { describe, expect, it } from 'vitest';
import { maskPhone } from './mask_phone.js';

describe('maskPhone', () => {
  it('mascara telefone E.164 BR', () => {
    expect(maskPhone('+5562998765432')).toBe('556****32');
  });

  it('retorna fallback para entrada curta', () => {
    expect(maskPhone('12')).toBe('****');
  });
});
