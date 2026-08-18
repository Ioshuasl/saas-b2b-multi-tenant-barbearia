import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { KeyManagementPort } from './key_management.port.js';

const ALGORITHM = 'aes-256-gcm';
const NONCE_LENGTH = 12;
const TAG_LENGTH = 16;
const DEK_LENGTH = 32;

/**
 * Adapter local (MVP): KEK em env/arquivo na VPS (ADR-0013).
 * Formato wrapped: Base64(nonce 12 | ciphertext | tag 16).
 */
export class LocalKeyManagementAdapter implements KeyManagementPort {
  private readonly kek: Buffer;

  constructor(kek: Buffer) {
    if (kek.length !== 32) {
      throw new Error('KEK deve ter 32 bytes (AES-256).');
    }
    this.kek = kek;
  }

  generateDek(): Buffer {
    return randomBytes(DEK_LENGTH);
  }

  async wrapDek(plaintextDek: Buffer): Promise<string> {
    if (plaintextDek.length !== DEK_LENGTH) {
      throw new Error('DEK deve ter 32 bytes.');
    }
    return this.seal(plaintextDek);
  }

  async unwrapDek(wrappedDekBase64: string): Promise<Buffer> {
    return this.open(wrappedDekBase64, 'wrapped_dek inválido.');
  }

  async sealSecret(plaintext: string): Promise<string> {
    return this.seal(Buffer.from(plaintext, 'utf8'));
  }

  async unsealSecret(sealedBase64: string): Promise<string> {
    return (await this.open(sealedBase64, 'segredo selado inválido.')).toString('utf8');
  }

  private seal(plaintext: Buffer): string {
    const nonce = randomBytes(NONCE_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.kek, nonce);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([nonce, ciphertext, tag]).toString('base64');
  }

  private async open(wrappedBase64: string, invalidMessage: string): Promise<Buffer> {
    const blob = Buffer.from(wrappedBase64, 'base64');
    if (blob.length < NONCE_LENGTH + TAG_LENGTH + 1) {
      throw new Error(invalidMessage);
    }
    const nonce = blob.subarray(0, NONCE_LENGTH);
    const tag = blob.subarray(blob.length - TAG_LENGTH);
    const ciphertext = blob.subarray(NONCE_LENGTH, blob.length - TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, this.kek, nonce);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }
}

/** Deriva 32 bytes a partir de material em Base64 ou string. */
export function resolveKekBytes(
  kekLocalBase64: string | undefined,
  tenantKek: string | undefined,
  nodeEnv: string,
): Buffer {
  const material = kekLocalBase64 ?? tenantKek;
  if (material && material.length > 0) {
    const decoded = Buffer.from(material, 'base64');
    if (decoded.length === 32) return decoded;
    return createHash('sha256').update(decoded.length > 0 ? decoded : Buffer.from(material)).digest();
  }

  if (nodeEnv === 'production') {
    throw new Error(
      'TENANT_KEK / KEK_LOCAL_BASE64 é obrigatório em production (ADR-0013). App não sobe sem KEK.',
    );
  }

  return createHash('sha256').update('dev-only-kek-not-for-production').digest();
}
