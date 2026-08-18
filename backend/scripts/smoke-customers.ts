import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/shared/auth/jwt.js';
import { SEED } from '../prisma/seeders/constants.js';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

type Json = Record<string, unknown>;

async function request(
  port: number,
  path: string,
  init: {
    method?: string;
    body?: unknown;
    token?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<{ status: number; body: Json }> {
  const headers: Record<string, string> = { ...(init.headers ?? {}) };
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: (text ? JSON.parse(text) : {}) as Json };
}

function fail(message: string, extra?: unknown): never {
  console.error('FAIL:', message, extra ?? '');
  throw new Error(message);
}

function dataOf(body: Json): Json {
  return (body.data ?? body) as Json;
}

async function main() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolveListen) => server.once('listening', () => resolveListen()));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('porta inválida');
  }
  const port = address.port;

  const tokenA = await signAccessToken({
    userId: SEED.userAOwner.id,
    tenantId: SEED.tenantA.id,
    role: 'OWNER',
  });
  const tokenBOwner = await signAccessToken({
    userId: SEED.userBOwner.id,
    tenantId: SEED.tenantB.id,
    role: 'OWNER',
  });

  const suffix = randomUUID().replace(/\D/g, '').slice(0, 8);
  const phoneDigits = `6299${suffix.slice(0, 7)}`;
  const phoneE164 = `+55${phoneDigits}`;

  const locationHeader = { 'x-location-id': SEED.locationA.id };

  const invalidPhone = await request(port, '/api/v1/customers', {
    method: 'POST',
    token: tokenA,
    headers: locationHeader,
    body: { name: 'Teste', phone: 'abc' },
  });
  if (invalidPhone.status !== 422 && invalidPhone.status !== 400) {
    fail('telefone inválido deveria 422/400', invalidPhone);
  }

  const created = await request(port, '/api/v1/customers', {
    method: 'POST',
    token: tokenA,
    headers: locationHeader,
    body: {
      name: 'João Smoke',
      phone: phoneDigits,
      notes: 'Prefere degradê',
      marketingOptIn: true,
    },
  });
  if (created.status !== 201) fail('create customer deveria 201', created);
  const customer = dataOf(created.body) as Json;
  const customerId = customer.id as string;
  if (customer.phone !== phoneE164) fail('telefone deveria normalizar E.164', customer);
  if (customer.notes !== 'Prefere degradê') fail('notes deveria decifrar na resposta', customer);

  const duplicate = await request(port, '/api/v1/customers', {
    method: 'POST',
    token: tokenA,
    headers: locationHeader,
    body: { name: 'Outro', phone: phoneDigits },
  });
  if (duplicate.status !== 409) fail('telefone duplicado deveria 409', duplicate);

  const checkDup = await request(
    port,
    `/api/v1/customers/check-duplicate?phone=${encodeURIComponent(phoneDigits)}`,
    { token: tokenA },
  );
  if (checkDup.status !== 200) fail('check-duplicate deveria 200', checkDup);
  const dupData = dataOf(checkDup.body) as Json;
  if (dupData.exists !== true || dupData.customerId !== customerId) {
    fail('check-duplicate deveria existir', dupData);
  }

  const listed = await request(port, '/api/v1/customers?search=João', { token: tokenA });
  if (listed.status !== 200) fail('list deveria 200', listed);
  const items = listed.body.data as Json[];
  if (!Array.isArray(items) || items.length < 1) fail('list deveria retornar cliente', listed);

  const got = await request(port, `/api/v1/customers/${customerId}`, { token: tokenA });
  if (got.status !== 200) fail('get deveria 200', got);

  const crossTenant = await request(port, `/api/v1/customers/${customerId}`, {
    token: tokenBOwner,
  });
  if (crossTenant.status !== 404) fail('tenant B não deveria ver cliente A', crossTenant);

  const updated = await request(port, `/api/v1/customers/${customerId}`, {
    method: 'PATCH',
    token: tokenA,
    body: { name: 'João Smoke Atualizado' },
  });
  if (updated.status !== 200) fail('patch deveria 200', updated);

  const appointments = await request(port, `/api/v1/customers/${customerId}/appointments`, {
    token: tokenA,
  });
  if (appointments.status !== 200) fail('appointments deveria 200', appointments);
  const apptData = dataOf(appointments.body) as Json;
  if (!Array.isArray(apptData.items) || apptData.totalSpentCents !== 0) {
    fail('appointments stub deveria lista vazia', apptData);
  }

  const deleted = await request(port, `/api/v1/customers/${customerId}`, {
    method: 'DELETE',
    token: tokenA,
  });
  if (deleted.status !== 204) fail('delete deveria 204', deleted);

  const afterDelete = await request(port, `/api/v1/customers/${customerId}`, { token: tokenA });
  if (afterDelete.status !== 404) fail('cliente inativado deveria 404 no get', afterDelete);

  server.close();
  console.log('OK: customers smoke passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
