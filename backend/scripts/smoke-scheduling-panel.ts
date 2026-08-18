import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/shared/auth/jwt.js';
import { getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { idGenerator } from '../src/shared/helpers/id_generator.js';
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

async function ensureBusinessHours(tenantId: string, locationId: string) {
  const db = getTenantPrisma();
  const ctx = {
    tenantId,
    userId: SEED.userAOwner.id,
    requestId: 'smoke-scheduling-panel',
    role: 'OWNER',
    locationScope: 'ALL' as const,
    locationIds: [] as string[],
  };
  const count = await db.runInTenantContext(ctx, (tx) =>
    tx.businessHours.count({ where: { locationId, staffId: null } }),
  );
  if (count > 0) return;

  const startsAt = new Date(Date.UTC(1970, 0, 1, 9, 0, 0));
  const endsAt = new Date(Date.UTC(1970, 0, 1, 19, 0, 0));
  await db.runInTenantContext(ctx, async (tx) => {
    for (const weekday of [1, 2, 3, 4, 5, 6]) {
      await tx.businessHours.create({
        data: {
          id: idGenerator.next(),
          tenantId,
          locationId,
          weekday,
          startsAt,
          endsAt,
        },
      });
    }
  });
}

async function ensureServiceAndStaff(tenantId: string, locationId: string) {
  const db = getTenantPrisma();
  const ctx = {
    tenantId,
    userId: SEED.userAOwner.id,
    requestId: 'smoke-scheduling-panel',
    role: 'OWNER',
    locationScope: 'ALL' as const,
    locationIds: [] as string[],
  };

  let serviceId = await db.runInTenantContext(ctx, (tx) =>
    tx.service.findFirst({ where: { tenantId, deletedAt: null }, select: { id: true } }),
  ).then((row) => row?.id);

  if (!serviceId) {
    serviceId = idGenerator.next();
    await db.runInTenantContext(ctx, async (tx) => {
      await tx.service.create({
        data: {
          id: serviceId!,
          tenantId,
          name: 'Corte Smoke',
          durationMinutes: 40,
          priceCents: 4500n,
        },
      });
    });
  }

  const staffId = idGenerator.next();
  await db.runInTenantContext(ctx, async (tx) => {
    await tx.staff.create({
      data: {
        id: staffId,
        tenantId,
        homeLocationId: locationId,
        name: 'Barbeiro Smoke Panel',
      },
    });
    await tx.staffLocation.create({
      data: { tenantId, staffId, locationId },
    });
  });

  return { serviceId: serviceId!, staffId };
}

async function main(): Promise<void> {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolveListen) => server.once('listening', () => resolveListen()));
  const address = server.address();
  if (!address || typeof address === 'string') fail('porta inválida');
  const port = address.port;

  const token = await signAccessToken({
    userId: SEED.userAOwner.id,
    tenantId: SEED.tenantA.id,
    role: 'OWNER',
  });
  const locationHeader = { 'x-location-id': SEED.locationA.id };
  await ensureBusinessHours(SEED.tenantA.id, SEED.locationA.id);
  const { serviceId, staffId } = await ensureServiceAndStaff(SEED.tenantA.id, SEED.locationA.id);

  const suffix = randomUUID().replace(/\D/g, '').slice(0, 8);
  const customerRes = await request(port, '/api/v1/customers', {
    method: 'POST',
    token,
    headers: locationHeader,
    body: { name: 'Cliente Agenda', phone: `6298${suffix.slice(0, 7)}` },
  });
  if (customerRes.status !== 201) fail('create customer', customerRes);
  const customerId = dataOf(customerRes.body).id as string;

  const from = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const availabilityStarted = Date.now();
  const availability = await request(
    port,
    `/api/v1/availability?locationId=${SEED.locationA.id}&serviceIds=${serviceId}&staffId=${staffId}&from=${from}&to=${from}`,
    { token, headers: locationHeader },
  );
  const availabilityMs = Date.now() - availabilityStarted;
  if (availability.status !== 200) fail('availability deveria 200', availability);
  const availabilityData = dataOf(availability.body) as Json;
  const slots = (availabilityData.slots ?? []) as Json[];
  if (slots.length === 0) fail('availability deveria retornar slots', availabilityData);
  if (availabilityMs > 5000) {
    console.warn(`WARN: availability levou ${availabilityMs}ms (meta p95 < 500ms em prod)`);
  }

  const slot = slots[0] as Json;
  const startsAt = slot.startsAt as string;
  const idempotencyKey = randomUUID();

  const createBody = {
    customerId,
    staffId,
    serviceIds: [serviceId],
    startsAt,
    source: 'PANEL',
  };

  const created = await request(port, '/api/v1/appointments', {
    method: 'POST',
    token,
    headers: { ...locationHeader, 'Idempotency-Key': idempotencyKey },
    body: createBody,
  });
  if (created.status !== 201) fail('create appointment deveria 201', created);
  const appointment = dataOf(created.body) as Json;
  const appointmentId = appointment.id as string;

  const replay = await request(port, '/api/v1/appointments', {
    method: 'POST',
    token,
    headers: { ...locationHeader, 'Idempotency-Key': idempotencyKey },
    body: createBody,
  });
  if (replay.status !== 201) fail('idempotency replay deveria 201', replay);
  if ((dataOf(replay.body) as Json).id !== appointmentId) {
    fail('idempotency deveria retornar mesmo appointment');
  }

  const overlap = await request(port, '/api/v1/appointments', {
    method: 'POST',
    token,
    headers: { ...locationHeader, 'Idempotency-Key': randomUUID() },
    body: createBody,
  });
  if (overlap.status !== 409) fail('overlap deveria 409 SLOT_TAKEN', overlap);

  const list = await request(port, '/api/v1/appointments?locationId=' + SEED.locationA.id, {
    token,
    headers: locationHeader,
  });
  if (list.status !== 200) fail('list appointments', list);

  const history = await request(port, `/api/v1/appointments/${appointmentId}/history`, {
    token,
    headers: locationHeader,
  });
  if (history.status !== 200) fail('history', history);
  const historyItems = dataOf(history.body) as unknown[];
  if (!Array.isArray(historyItems) || historyItems.length < 1) {
    fail('history deveria ter CREATED');
  }

  const customerAppointments = await request(port, `/api/v1/customers/${customerId}/appointments`, {
    token,
    headers: locationHeader,
  });
  if (customerAppointments.status !== 200) fail('customer appointments', customerAppointments);
  const custItems = (dataOf(customerAppointments.body) as Json).items as unknown[];
  if (!Array.isArray(custItems) || custItems.length < 1) {
    fail('customer appointments deveria listar agendamento');
  }

  server.close();
  console.log('OK: scheduling panel (availability + CRUD + idempotency + conflicts path)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
