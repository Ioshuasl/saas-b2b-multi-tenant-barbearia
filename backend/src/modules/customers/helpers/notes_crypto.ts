import { getKeyManagement } from '../../../shared/crypto/index.js';

export async function sealCustomerNotes(plaintext: string | undefined): Promise<string | undefined> {
  if (plaintext === undefined || plaintext.length === 0) return undefined;
  return getKeyManagement().sealSecret(plaintext);
}

export async function unsealCustomerNotes(sealed: string | null | undefined): Promise<string | null> {
  if (!sealed) return null;
  return getKeyManagement().unsealSecret(sealed);
}
