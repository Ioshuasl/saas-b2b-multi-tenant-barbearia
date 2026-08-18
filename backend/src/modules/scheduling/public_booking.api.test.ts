import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from '../../app.js';
import { SEED } from '../../../prisma/seeders/constants.js';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

type Json = Record<string, unknown>;

const hasDb = Boolean(process.env.DATABASE_URL);

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

describe.skipIf(!hasDb)('public booking API (S4)', () => {
  let server: Server;
  let port: number;

  beforeAll(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise<void>((resolveListen) => server.once('listening', () => resolveListen()));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('porta inválida');
    port = address.port;
  });

  afterAll(async () => {
    await new Promise<void>((resolveClose, reject) => {
      server.close((err) => (err ? reject(err) : resolveClose()));
    });
  });

  it('GET /public/{tenantSlug} devolve logoUrl e locations', async () => {
    const res = await request(port, `/api/v1/public/${SEED.tenantA.slug}`);
    expect(res.status).toBe(200);
    const data = dataOf(res.body);
    expect(data.slug).toBe(SEED.tenantA.slug);
    expect(data.logoUrl === null || typeof data.logoUrl === 'string').toBe(true);
    expect(Array.isArray(data.locations)).toBe(true);
  });

  it('GET /public/{tenantSlug}/{locationSlug} devolve staff[] e serviços', async () => {
    const res = await request(
      port,
      `/api/v1/public/${SEED.tenantB.slug}/${SEED.locationBCentro.slug}`,
    );
    expect(res.status).toBe(200);
    const data = dataOf(res.body);
    expect(data.bookingAvailable).toBe(true);
    expect(Array.isArray(data.staff)).toBe(true);
    expect((data.staff as Json[]).length).toBeGreaterThan(0);
    expect(Array.isArray(data.services)).toBe(true);
    expect((data.services as Json[]).length).toBeGreaterThan(0);
  });

  it('GET availability público retorna slots', async () => {
    const location = await request(
      port,
      `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}`,
    );
    const serviceId = ((dataOf(location.body).services as Json[])[0] as Json).id as string;
    const from = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const res = await request(
      port,
      `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/availability?serviceIds=${serviceId}&from=${from}&to=${from}`,
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(dataOf(res.body).slots)).toBe(true);
    expect((dataOf(res.body).slots as Json[]).length).toBeGreaterThan(0);
  });

  it('POST book exige consentimento e rejeita honeypot', async () => {
    const location = await request(
      port,
      `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}`,
    );
    const serviceId = ((dataOf(location.body).services as Json[])[0] as Json).id as string;
    const from = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const availability = await request(
      port,
      `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/availability?serviceIds=${serviceId}&from=${from}&to=${from}`,
    );
    const startsAt = ((dataOf(availability.body).slots as Json[])[0] as Json).startsAt as string;
    const baseBody = {
      serviceIds: [serviceId],
      staffId: null,
      startsAt,
      customer: { name: 'Vitest S4', phone: randomPhone() },
      consentWhatsappMarketing: false,
    };

    const honeypot = await request(
      port,
      `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': randomUUID() },
        body: { ...baseBody, consentDataProcessing: true, website: 'bot' },
      },
    );
    expect(honeypot.status).toBe(400);

    const noConsent = await request(
      port,
      `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': randomUUID() },
        body: { ...baseBody, consentDataProcessing: false },
      },
    );
    expect(noConsent.status).toBe(422);
    expect(errorCode(noConsent.body)).toBe('CONSENT_REQUIRED');
  });

  it('fluxo book → GET mascarado → DELETE cancel', async () => {
    const location = await request(
      port,
      `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}`,
    );
    const serviceId = ((dataOf(location.body).services as Json[])[0] as Json).id as string;
    const from = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const availability = await request(
      port,
      `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/availability?serviceIds=${serviceId}&from=${from}&to=${from}`,
    );
    const slot = (dataOf(availability.body).slots as Json[])[0] as Json;
    const phone = randomPhone();

    const booked = await request(
      port,
      `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': randomUUID() },
        body: {
          serviceIds: [serviceId],
          staffId: slot.staffId,
          startsAt: slot.startsAt,
          customer: { name: 'Vitest Fluxo', phone },
          consentDataProcessing: true,
          consentWhatsappMarketing: false,
        },
      },
    );
    expect(booked.status).toBe(201);
    const bookedData = dataOf(booked.body);
    expect(bookedData.cancelToken).toBeTruthy();

    const masked = await request(
      port,
      `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments/${bookedData.id}?token=${bookedData.cancelToken}`,
    );
    expect(masked.status).toBe(200);
    const customer = (dataOf(masked.body).customer ?? {}) as Json;
    expect(customer.phoneMasked).toBeTruthy();
    expect(customer.phoneMasked).not.toBe(phone);

    const invalid = await request(
      port,
      `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments/${bookedData.id}?token=${randomUUID()}`,
    );
    expect(invalid.status).toBe(404);
    expect(errorCode(invalid.body)).toBe('INVALID_CANCEL_TOKEN');

    const cancelled = await request(
      port,
      `/api/v1/public/${SEED.tenantA.slug}/${SEED.locationA.slug}/appointments/${bookedData.id}?token=${bookedData.cancelToken}`,
      { method: 'DELETE', body: { reason: 'Vitest' } },
    );
    expect(cancelled.status).toBe(204);
  });

  it('tenant inexistente retorna 404', async () => {
    const res = await request(port, '/api/v1/public/tenant-inexistente-s4');
    expect(res.status).toBe(404);
  });
});
