import assert from 'node:assert/strict';
import {
  LocalKeyManagementAdapter,
  resolveKekBytes,
} from '../src/shared/crypto/local_key_management.adapter.js';

async function main() {
  const kek = resolveKekBytes(undefined, undefined, 'test');
  const kms = new LocalKeyManagementAdapter(kek);

  const dek = kms.generateDek();
  assert.equal(dek.length, 32);

  const wrapped = await kms.wrapDek(dek);
  const unwrapped = await kms.unwrapDek(wrapped);
  assert.ok(dek.equals(unwrapped), 'unwrap deve recuperar a DEK');
  assert.notEqual(wrapped, dek.toString('base64'));

  const sealed = await kms.sealSecret('waha-token-secret');
  const unsealed = await kms.unsealSecret(sealed);
  assert.equal(unsealed, 'waha-token-secret');

  const other = kms.generateDek();
  const wrappedOther = await kms.wrapDek(other);
  assert.notEqual(wrapped, wrappedOther);

  const badKms = new LocalKeyManagementAdapter(
    resolveKekBytes('YmFkLWtleS1tYXRlcmlhbC1mb3ItdGVzdCEh', undefined, 'test'),
  );
  let failed = false;
  try {
    await badKms.unwrapDek(wrapped);
  } catch {
    failed = true;
  }
  assert.ok(failed, 'unwrap com KEK errada deve falhar');

  let prodFailed = false;
  try {
    resolveKekBytes(undefined, undefined, 'production');
  } catch {
    prodFailed = true;
  }
  assert.ok(prodFailed, 'production sem KEK deve falhar');

  console.log('OK: KeyManagementPort local wrap/unwrap');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
