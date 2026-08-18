import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createApp } from '../src/app.js';
import { getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
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
    headers?: Record<string, string>;
  } = {},
): Promise<{ status: number; body: Json }> {
  const headers: Record<string, string> = { ...(init.headers ?? {}) };
  if (init.body !== undefined) headers['content-type'] = 'application/json';
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

async function pickPublicSlot(
  port: number,
  tenantSlug: string,
  locationSlug: string,
  serviceId: string,
  staffId?: string,
): Promise<{ startsAt: string; staffId: string }> {
  const staffQuery = staffId ? `&staffId=${staffId}` : '';
  for (let offset = 3; offset < 15; offset += 1) {
    const from = new Date(Date.now() + offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const availability = await request(
      port,
      `/api/v1/public/${tenantSlug}/${locationSlug}/availability?serviceIds=${serviceId}&from=${from}&to=${from}${staffQuery}`,
    );
    if (availability.status !== 200) fail('availability', availability);
    const slots = (dataOf(availability.body).slots ?? []) as Json[];
    if (slots.length > 0) {
      const slot = slots[0] as Json;
      return { startsAt: slot.startsAt as string, staffId: slot.staffId as string };
    }
  }
  fail('availability sem slots em 12 dias');
}

function bookBody(input: {
  serviceIds: string[];
  startsAt: string;
  phone: string;
  staffId?: string | null;
}) {
  return {
    serviceIds: input.serviceIds,
    staffId: input.staffId ?? null,
    startsAt: input.startsAt,
    customer: { name: 'Cliente S4 Smoke', phone: input.phone },
    consentDataProcessing: true as const,
    consentWhatsappMarketing: false,
  };
}

async function firstVisibleServiceId(tenantId: string, userId: string): Promise<string> {
  const db = getTenantPrisma();
  const ctx = {
    tenantId,
    userId,
    requestId: 'smoke-public-booking',
    role: 'OWNER',
    locationScope: 'ALL' as const,
    locationIds: [] as string[],
  };
  const row = await db.runInTenantContext(ctx, (tx) =>
    tx.service.findFirst({
      where: { deletedAt: null, active: true, visibleOnline: true },
      select: { id: true },
    }),
  );
  if (!row?.id) fail('nenhum serviço visível online no seed');
  return row.id;
}

async function runTenantSelectorSmoke(port: number): Promise<void> {
  const navalha = await request(port, `/api/v1/public/${SEED.tenantA.slug}`);
  if (navalha.status !== 200) fail('GET tenant navalha', navalha);
  const navalhaData = dataOf(navalha.body);
  const navalhaLocations = navalhaData.locations as Json[];
  if (navalhaLocations.length !== 1) {
    fail('navalha deveria ter 1 unidade', navalhaData);
  }
  if (navalhaData.logoUrl !== null && typeof navalhaData.logoUrl !== 'string') {
    fail('logoUrl inválido', navalhaData);
  }

  const rede = await request(port, `/api/v1/public/${SEED.tenantB.slug}`);
  if (rede.status !== 200) fail('GET tenant corte-fino', rede);
  const redeData = dataOf(rede.body);
  const names = ((redeData.locations ?? []) as Json[]).map((item) => item.name as string);
  if (!names.includes('Centro') || !names.includes('Jardim')) {
    fail('corte-fino deveria listar Centro e Jardim', names);
  }
}

async function runLocationStaffSmoke(port: number): Promise<void> {
  const location = await request(
    port,
    `/api/v1/public/${SEED.tenantB.slug}/${SEED.locationBCentro.slug}`,
  );
  if (location.status !== 200) fail('GET location centro', location);
  const data = dataOf(location.body);
  if (!Array.isArray(data.staff) || (data.staff as Json[]).length === 0) {
    fail('staff[] ausente ou vazio', data);
  }
  for (const person of data.staff as Json[]) {
    if (typeof person.id !== 'string' || typeof person.name !== 'string') {
      fail('staff card inválido', person);
    }
  }
}

async function runTokenSmoke(port: number): Promise<void> {
  const serviceId = await firstVisibleServiceId(SEED.tenantA.id, SEED.userAOwner.id);
  const slot = await pickPublicSlot(port, SEED.tenantA.slug, SEED.locationA.slug, serviceId);
  const phone = randomPhone();

  const booked = await request(
    port,
    `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': randomUUID() },
      body: bookBody({
        serviceIds: [serviceId],
        startsAt: slot.startsAt,
        phone,
        staffId: slot.staffId,
      }),
    },
  );
  if (booked.status !== 201) fail('POST book', booked);
  const bookedData = dataOf(booked.body);
  const appointmentId = bookedData.id as string;
  const cancelToken = bookedData.cancelToken as string;

  const invalid = await request(
    port,
    `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments/${appointmentId}?token=${randomUUID()}`,
  );
  if (invalid.status !== 404 || errorCode(invalid.body) !== 'INVALID_CANCEL_TOKEN') {
    fail('token inválido deveria INVALID_CANCEL_TOKEN 404', invalid);
  }

  const masked = await request(
    port,
    `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments/${appointmentId}?token=${cancelToken}`,
  );
  if (masked.status !== 200) fail('GET by token', masked);
  const customer = (dataOf(masked.body).customer ?? {}) as Json;
  if (!customer.phoneMasked || customer.phoneMasked === phone) {
    fail('telefone deveria estar mascarado', customer);
  }

  const otherSlot = await pickPublicSlot(
    port,
    SEED.tenantA.slug,
    SEED.locationA.slug,
    serviceId,
    slot.staffId,
  );
  const rescheduled = await request(
    port,
    `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments/${appointmentId}?token=${cancelToken}`,
    {
      method: 'PATCH',
      body: { startsAt: otherSlot.startsAt, staffId: otherSlot.staffId },
    },
  );
  if (rescheduled.status !== 200) fail('PATCH remarcar', rescheduled);

  const cancelled = await request(
    port,
    `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments/${appointmentId}?token=${cancelToken}`,
    { method: 'DELETE', body: { reason: 'Smoke S4' } },
  );
  if (cancelled.status !== 204) fail('DELETE cancelar', cancelled);
}

async function runSlotTakenSmoke(port: number): Promise<void> {
  const serviceId = await firstVisibleServiceId(SEED.tenantA.id, SEED.userAOwner.id);
  const slot = await pickPublicSlot(port, SEED.tenantA.slug, SEED.locationA.slug, serviceId);
  const body = bookBody({
    serviceIds: [serviceId],
    startsAt: slot.startsAt,
    phone: randomPhone(),
    staffId: slot.staffId,
  });

  const first = await request(
    port,
    `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments`,
    { method: 'POST', headers: { 'Idempotency-Key': randomUUID() }, body },
  );
  if (first.status !== 201) fail('primeiro book', first);

  const second = await request(
    port,
    `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': randomUUID() },
      body: { ...body, customer: { ...body.customer, phone: randomPhone() } },
    },
  );
  if (second.status !== 409 || errorCode(second.body) !== 'SLOT_TAKEN') {
    fail('segundo book deveria SLOT_TAKEN', second);
  }
}

async function runUnavailableSmoke(port: number): Promise<void> {
  const db = getTenantPrisma();
  const ctx = {
    tenantId: SEED.tenantB.id,
    userId: SEED.userBOwner.id,
    requestId: 'smoke-public-booking',
    role: 'OWNER',
    locationScope: 'ALL' as const,
    locationIds: [] as string[],
  };
  const services = await db.runInTenantContext(ctx, (tx) =>
    tx.service.findMany({
      where: { deletedAt: null, active: true },
      select: { id: true },
    }),
  );

  await db.runInTenantContext(ctx, async (tx) => {
    for (const service of services) {
      await tx.locationService.upsert({
        where: {
          locationId_serviceId: {
            locationId: SEED.locationBJardim.id,
            serviceId: service.id,
          },
        },
        create: {
          tenantId: SEED.tenantB.id,
          locationId: SEED.locationBJardim.id,
          serviceId: service.id,
          active: false,
        },
        update: { active: false },
      });
    }
  });

  const location = await request(
    port,
    `/api/v1/public/${SEED.tenantB.slug}/${SEED.locationBJardim.slug}`,
  );
  if (location.status !== 200) fail('GET jardim indisponível', location);
  const data = dataOf(location.body);
  if (data.bookingAvailable !== false) fail('bookingAvailable deveria false', data);

  await db.runInTenantContext(ctx, async (tx) => {
    for (const service of services) {
      await tx.locationService.deleteMany({
        where: {
          locationId: SEED.locationBJardim.id,
          serviceId: service.id,
        },
      });
    }
  });
}

async function main(): Promise<void> {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolveListen) => server.once('listening', () => resolveListen()));
  const address = server.address();
  if (!address || typeof address === 'string') fail('porta inválida');
  const port = address.port;

  await runTenantSelectorSmoke(port);
  await runLocationStaffSmoke(port);
  await runTokenSmoke(port);
  await runSlotTakenSmoke(port);
  await runUnavailableSmoke(port);

  server.close();
  console.log('OK: public booking S4 (tenant/location/token/reschedule/SLOT_TAKEN/indisponível)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
