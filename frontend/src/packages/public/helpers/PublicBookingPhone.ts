const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

/** Normaliza telefone BR comum para E.164. Retorna null se inválido. */
export function toPublicPhoneE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) return finishE164(`+${digits}`);
  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
    return finishE164(`+${digits}`);
  }
  if (digits.length === 10 || digits.length === 11) return finishE164(`+55${digits}`);
  return null;
}

function finishE164(value: string): string | null {
  return E164_PATTERN.test(value) ? value : null;
}
