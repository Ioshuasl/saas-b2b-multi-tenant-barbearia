import { describe, expect, it } from 'vitest';
import { AppError } from '../../../shared/domain/errors.js';
import { normalizePhoneE164 } from './phone_e164.js';

describe('normalizePhoneE164', () => {
  it('normaliza DDD + celular BR para +55', () => {
    expect(normalizePhoneE164('62998765432')).toBe('+5562998765432');
  });

  it('preserva formato internacional válido', () => {
    expect(normalizePhoneE164('+5562998765432')).toBe('+5562998765432');
  });

  it('rejeita telefone inválido', () => {
    expect(() => normalizePhoneE164('abc')).toThrow(AppError);
  });
});
