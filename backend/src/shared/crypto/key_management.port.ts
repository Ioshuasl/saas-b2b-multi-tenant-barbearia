/**
 * Port de KMS / envelope (ADR-0007, ADR-0013).
 * Wrap/unwrap da DEK com a KEK — implementação trocável (local → Vault).
 */
export type KeyManagementPort = {
  generateDek(): Buffer;
  wrapDek(plaintextDek: Buffer): Promise<string>;
  unwrapDek(wrappedDekBase64: string): Promise<Buffer>;
  sealSecret(plaintext: string): Promise<string>;
  unsealSecret(sealedBase64: string): Promise<string>;
};
