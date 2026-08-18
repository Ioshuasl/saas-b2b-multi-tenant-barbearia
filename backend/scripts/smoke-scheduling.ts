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

function errorCode(body: Json): string | undefined {
  const error = body.error as Json | undefined;
  return error?.code as string | undefined;
}

function randomPhone(): string {
  const suffix = randomUUID().replace(/\D/g, '').slice(0, 8);
  return `629${suffix}`;
}

async function ensureBusinessHours(tenantId: string, locationId: string) {
  const db = getTenantPrisma();
  const ctx = {
    tenantId,
    userId: SEED.userAOwner.id,
    requestId: 'smoke-scheduling',
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

async function ensureServiceId(tenantId: string, userId: string): Promise<string> {
  const db = getTenantPrisma();
  const ctx = {
    tenantId,
    userId,
    requestId: 'smoke-scheduling',
    role: 'OWNER',
    locationScope: 'ALL' as const,
    locationIds: [] as string[],
  };
  const existing = await db.runInTenantContext(ctx, (tx) =>
    tx.service.findFirst({
      where: { tenantId, deletedAt: null, active: true, visibleOnline: true },
      select: { id: true },
    }),
  );
  if (existing?.id) return existing.id;

  const serviceId = idGenerator.next();
  await db.runInTenantContext(ctx, async (tx) => {
    await tx.service.create({
      data: {
        id: serviceId,
        tenantId,
        name: 'Corte Smoke',
        durationMinutes: 40,
        priceCents: 4500n,
        visibleOnline: true,
      },
    });
  });
  return serviceId;
}

async function ensureStaffAtLocations(
  tenantId: string,
  userId: string,
  locationIds: string[],
  homeLocationId: string,
): Promise<string> {
  const db = getTenantPrisma();
  const ctx = {
    tenantId,
    userId,
    requestId: 'smoke-scheduling',
    role: 'OWNER',
    locationScope: 'ALL' as const,
    locationIds: [] as string[],
  };
  const staffId = idGenerator.next();
  await db.runInTenantContext(ctx, async (tx) => {
    await tx.staff.create({
      data: {
        id: staffId,
        tenantId,
        homeLocationId,
        name: 'Barbeiro Smoke Cross',
      },
    });
    for (const locationId of locationIds) {
      await tx.staffLocation.create({ data: { tenantId, staffId, locationId } });
    }
  });
  return staffId;
}

async function pickSlot(
  port: number,
  tenantSlug: string,
  locationSlug: string,
  serviceId: string,
  staffId?: string,
): Promise<string> {
  const from = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const staffQuery = staffId ? `&staffId=${staffId}` : '';
  const availability = await request(
    port,
    `/api/v1/public/${tenantSlug}/${locationSlug}/availability?serviceIds=${serviceId}&from=${from}&to=${from}${staffQuery}`,
  );
  if (availability.status !== 200) fail('public availability', availability);
  const slots = (dataOf(availability.body).slots ?? []) as Json[];
  if (slots.length === 0) fail('public availability sem slots', dataOf(availability.body));
  return (slots[0] as Json).startsAt as string;
}

function publicBookBody(input: {
  serviceIds: string[];
  startsAt: string;
  phone: string;
  staffId?: string;
}) {
  return {
    serviceIds: input.serviceIds,
    staffId: input.staffId ?? null,
    startsAt: input.startsAt,
    customer: {
      name: 'Cliente Público',
      phone: input.phone,
      email: 'cliente@example.com',
    },
    consentDataProcessing: true as const,
    consentWhatsappMarketing: true,
  };
}

async function runPanelSmoke(port: number): Promise<void> {
  const token = await signAccessToken({
    userId: SEED.userAOwner.id,
    tenantId: SEED.tenantA.id,
    role: 'OWNER',
  });
  const locationHeader = { 'x-location-id': SEED.locationA.id };
  await ensureBusinessHours(SEED.tenantA.id, SEED.locationA.id);
  const serviceId = await ensureServiceId(SEED.tenantA.id, SEED.userAOwner.id);
  const staffId = await ensureStaffAtLocations(
    SEED.tenantA.id,
    SEED.userAOwner.id,
    [SEED.locationA.id],
    SEED.locationA.id,
  );

  const from = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const availability = await request(
    port,
    `/api/v1/availability?locationId=${SEED.locationA.id}&serviceIds=${serviceId}&staffId=${staffId}&from=${from}&to=${from}`,
    { token, headers: locationHeader },
  );
  if (availability.status !== 200) fail('panel availability', availability);

  const slots = (dataOf(availability.body).slots ?? []) as Json[];
  if (slots.length === 0) fail('panel availability sem slots');
  const startsAt = (slots[0] as Json).startsAt as string;

  const suffix = randomUUID().replace(/\D/g, '').slice(0, 8);
  const customerRes = await request(port, '/api/v1/customers', {
    method: 'POST',
    token,
    headers: locationHeader,
    body: { name: 'Cliente Agenda', phone: `6298${suffix.slice(0, 7)}` },
  });
  if (customerRes.status !== 201) fail('create customer', customerRes);
  const customerId = dataOf(customerRes.body).id as string;

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
  if (created.status !== 201) fail('panel create appointment', created);

  const overlap = await request(port, '/api/v1/appointments', {
    method: 'POST',
    token,
    headers: { ...locationHeader, 'Idempotency-Key': randomUUID() },
    body: createBody,
  });
  if (overlap.status !== 409 || errorCode(overlap.body) !== 'SLOT_TAKEN') {
    fail('panel overlap deveria SLOT_TAKEN', overlap);
  }
}

async function runPublicSmoke(port: number): Promise<{ serviceId: string; staffId: string }> {
  const invalidTenant = await request(port, '/api/v1/public/tenant-inexistente');
  if (invalidTenant.status !== 404) fail('tenant inválido deveria 404', invalidTenant);

  const tenant = await request(port, `/api/v1/public/${SEED.tenantA.slug}`);
  if (tenant.status !== 200) fail('public tenant', tenant);
  const tenantData = dataOf(tenant.body);
  if (!Array.isArray(tenantData.locations)) fail('tenant deveria listar locations');
  if (tenantData.logoUrl !== null && typeof tenantData.logoUrl !== 'string') {
    fail('logoUrl deveria ser string ou null', tenantData);
  }

  const location = await request(port, `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}`);
  if (location.status !== 200) fail('public location', location);
  const locationData = dataOf(location.body);
  if (locationData.bookingAvailable !== true) fail('bookingAvailable deveria true', locationData);
  if (!Array.isArray(locationData.staff)) fail('location deveria listar staff[]', locationData);

  const serviceId = await ensureServiceId(SEED.tenantA.id, SEED.userAOwner.id);
  const staffId = await ensureStaffAtLocations(
    SEED.tenantA.id,
    SEED.userAOwner.id,
    [SEED.locationA.id],
    SEED.locationA.id,
  );

  const startsAt = await pickSlot(port, SEED.tenantA.slug, SEED.locationA.slug, serviceId, staffId);
  const phone = randomPhone();

  const honeypot = await request(
    port,
    `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': randomUUID() },
      body: { ...publicBookBody({ serviceIds: [serviceId], startsAt, phone }), website: 'bot' },
    },
  );
  if (honeypot.status !== 400) fail('honeypot deveria 400', honeypot);

  const noConsent = await request(
    port,
    `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': randomUUID() },
      body: {
        ...publicBookBody({ serviceIds: [serviceId], startsAt, phone: randomPhone() }),
        consentDataProcessing: false,
      },
    },
  );
  if (noConsent.status !== 422 || errorCode(noConsent.body) !== 'CONSENT_REQUIRED') {
    fail('consent obrigatório', noConsent);
  }

  const booked = await request(
    port,
    `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': randomUUID() },
      body: publicBookBody({ serviceIds: [serviceId], startsAt, phone, staffId }),
    },
  );
  if (booked.status !== 201) fail('public book', booked);
  const bookedData = dataOf(booked.body);
  const appointmentId = bookedData.id as string;
  const cancelToken = bookedData.cancelToken as string;
  if (!cancelToken) fail('cancelToken ausente na resposta 201');

  const masked = await request(
    port,
    `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments/${appointmentId}?token=${cancelToken}`,
  );
  if (masked.status !== 200) fail('get by token', masked);
  const maskedData = dataOf(masked.body);
  const customer = maskedData.customer as Json;
  if (!customer?.phoneMasked || customer.phoneMasked === phone) {
    fail('telefone deveria estar mascarado', maskedData);
  }

  const cancelled = await request(
    port,
    `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments/${appointmentId}?token=${cancelToken}`,
    { method: 'DELETE', body: { reason: 'Desistência' } },
  );
  if (cancelled.status !== 204) fail('cancel público', cancelled);

  return { serviceId, staffId };
}

async function runCrossUnitSmoke(port: number, serviceId: string, staffId: string): Promise<void> {
  await ensureBusinessHours(SEED.tenantB.id, SEED.locationBCentro.id);
  await ensureBusinessHours(SEED.tenantB.id, SEED.locationBJardim.id);

  const crossStaffId = await ensureStaffAtLocations(
    SEED.tenantB.id,
    SEED.userBOwner.id,
    [SEED.locationBCentro.id, SEED.locationBJardim.id],
    SEED.locationBCentro.id,
  );

  const serviceB = await ensureServiceId(SEED.tenantB.id, SEED.userBOwner.id);
  const startsAt = await pickSlot(
    port,
    SEED.tenantB.slug,
    SEED.locationBCentro.slug,
    serviceB,
    crossStaffId,
  );

  const phone = randomPhone();
  const body = publicBookBody({
    serviceIds: [serviceB],
    startsAt,
    phone,
    staffId: crossStaffId,
  });

  const first = await request(
    port,
    `/api/v1/public/${SEED.tenantB.slug}/${SEED.locationBCentro.slug}/appointments`,
    { method: 'POST', headers: { 'Idempotency-Key': randomUUID() }, body },
  );
  if (first.status !== 201) fail('cross-unit first book', first);

  const second = await request(
    port,
    `/api/v1/public/${SEED.tenantB.slug}/${SEED.locationBJardim.slug}/appointments`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': randomUUID() },
      body: { ...body, customer: { ...body.customer, phone: randomPhone() } },
    },
  );
  if (second.status !== 409 || errorCode(second.body) !== 'SLOT_TAKEN') {
    fail('cross-unit segundo book deveria SLOT_TAKEN', second);
  }

  void serviceId;
  void staffId;
}

async function runConcurrencySmoke(port: number): Promise<void> {
  const serviceId = await ensureServiceId(SEED.tenantA.id, SEED.userAOwner.id);
  const staffId = await ensureStaffAtLocations(
    SEED.tenantA.id,
    SEED.userAOwner.id,
    [SEED.locationA.id],
    SEED.locationA.id,
  );
  const startsAt = await pickSlot(port, SEED.tenantA.slug, SEED.locationA.slug, serviceId, staffId);

  const results = await Promise.all(
    Array.from({ length: 50 }, (_, index) =>
      request(
        port,
        `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments`,
        {
          method: 'POST',
          headers: { 'Idempotency-Key': randomUUID() },
          body: publicBookBody({
            serviceIds: [serviceId],
            startsAt,
            phone: randomPhone(),
            staffId,
          }),
        },
      ),
    ),
  );

  const created = results.filter((res) => res.status === 201);
  const conflicts = results.filter((res) => res.status === 409 && errorCode(res.body) === 'SLOT_TAKEN');
  if (created.length !== 1 || conflicts.length !== 49) {
    fail(`concorrência: esperado 1x201 e 49x409 SLOT_TAKEN; got ${created.length} e ${conflicts.length}`, {
      statuses: results.map((res) => res.status),
    });
  }
}

async function runMaxFutureSmoke(port: number): Promise<void> {
  const serviceId = await ensureServiceId(SEED.tenantA.id, SEED.userAOwner.id);
  const staffId = await ensureStaffAtLocations(
    SEED.tenantA.id,
    SEED.userAOwner.id,
    [SEED.locationA.id],
    SEED.locationA.id,
  );
  const phone = randomPhone();

  for (let i = 0; i < 3; i += 1) {
    const startsAt = await pickSlot(
      port,
      SEED.tenantA.slug,
      SEED.locationA.slug,
      serviceId,
      staffId,
    );
    const res = await request(
      port,
      `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': randomUUID() },
        body: publicBookBody({ serviceIds: [serviceId], startsAt, phone, staffId }),
      },
    );
    if (res.status !== 201) fail(`max future book ${i + 1}`, res);
  }

  const startsAt = await pickSlot(
    port,
    SEED.tenantA.slug,
    SEED.locationA.slug,
    serviceId,
    staffId,
  );
  const fourth = await request(
    port,
    `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': randomUUID() },
      body: publicBookBody({ serviceIds: [serviceId], startsAt, phone, staffId }),
    },
  );
  if (fourth.status !== 422 || errorCode(fourth.body) !== 'MAX_FUTURE_BOOKINGS') {
    fail('4º agendamento deveria MAX_FUTURE_BOOKINGS', fourth);
  }
}

async function main(): Promise<void> {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolveListen) => server.once('listening', () => resolveListen()));
  const address = server.address();
  if (!address || typeof address === 'string') fail('porta inválida');
  const port = address.port;

  await runConcurrencySmoke(port);
  await runPanelSmoke(port);
  const { serviceId, staffId } = await runPublicSmoke(port);
  await runCrossUnitSmoke(port, serviceId, staffId);
  await runMaxFutureSmoke(port);

  server.close();
  console.log('OK: scheduling (panel + public + cross-unit + concurrency + max future)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
