import { AppError } from '../../../shared/domain/errors.js';

const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

/** Normaliza entrada BR comum para E.164 (+55…). */
export function normalizePhoneE164(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Telefone é obrigatório.', 422, [
      { field: 'phone', issue: 'Telefone é obrigatório.' },
    ]);
  }

  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) {
    return finishE164(`+${digits}`);
  }

  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
    return finishE164(`+${digits}`);
  }

  if (digits.length === 10 || digits.length === 11) {
    return finishE164(`+55${digits}`);
  }

  throw new AppError('VALIDATION_ERROR', 'Telefone inválido. Use DDD + número ou formato internacional.', 422, [
    { field: 'phone', issue: 'Formato E.164 inválido.' },
  ]);
}

function finishE164(value: string): string {
  if (!E164_PATTERN.test(value)) {
    throw new AppError('VALIDATION_ERROR', 'Telefone inválido. Use DDD + número ou formato internacional.', 422, [
      { field: 'phone', issue: 'Formato E.164 inválido.' },
    ]);
  }
  return value;
}

export function phoneSearchDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}
