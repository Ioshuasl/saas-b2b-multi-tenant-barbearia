import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
  apiUrl,
  authHeaders,
  dataOf,
  errorCode,
  loginApi,
  randomPhone,
} from './api-helpers';

const LOCATION_NAVALHA = '018f0000-0000-7000-8000-0000000000a1';
const TENANT_NAVALHA = 'navalha';
const LOCATION_SLUG = 'default';

async function ensureStaff(
  request: Parameters<typeof loginApi>[0],
  accessToken: string,
): Promise<string> {
  const headers = authHeaders(accessToken, LOCATION_NAVALHA);
  const list = await request.get(apiUrl('/staff'), { headers });
  expect(list.status()).toBe(200);
  const items = (dataOf((await list.json()) as Record<string, unknown>).items ??
    []) as Array<{ id: string }>;
  if (items.length > 0) return items[0]!.id;

  const created = await request.post(apiUrl('/staff'), {
    headers,
    data: {
      name: 'Barbeiro E2E S2',
      homeLocationId: LOCATION_NAVALHA,
      locationIds: [LOCATION_NAVALHA],
      acceptsOnlineBooking: true,
    },
  });
  expect(created.status()).toBe(201);
  return dataOf((await created.json()) as Record<string, unknown>).id as string;
}

test.describe('S2 — Clientes (API autenticada)', () => {
  test('cria cliente com telefone E.164 e rejeita duplicata', async ({ request }) => {
    const { accessToken } = await loginApi(request, 'owner@navalha.local');
    const phone = randomPhone();
    const headers = authHeaders(accessToken, LOCATION_NAVALHA);

    const created = await request.post(apiUrl('/customers'), {
      headers,
      data: { name: 'Cliente E2E S2', phone, marketingOptIn: false },
    });
    expect(created.status()).toBe(201);
    const customer = dataOf((await created.json()) as Record<string, unknown>);
    expect(customer.phone).toBe(`+55${phone}`);

    const duplicate = await request.post(apiUrl('/customers'), {
      headers,
      data: { name: 'Outro Nome', phone },
    });
    expect(duplicate.status()).toBe(409);
    expect(errorCode((await duplicate.json()) as Record<string, unknown>)).toBe('DUPLICATE_RESOURCE');
  });

  test('check-duplicate detecta telefone existente', async ({ request }) => {
    const { accessToken } = await loginApi(request, 'owner@navalha.local');
    const phone = randomPhone();
    const headers = authHeaders(accessToken, LOCATION_NAVALHA);

    await request.post(apiUrl('/customers'), {
      headers,
      data: { name: 'Check Dup', phone },
    });

    const check = await request.get(apiUrl(`/customers/check-duplicate?phone=${phone}`), {
      headers,
    });
    expect(check.status()).toBe(200);
    const result = dataOf((await check.json()) as Record<string, unknown>);
    expect(result.exists).toBe(true);
  });
});

test.describe('S2 — Agenda painel (API autenticada)', () => {
  test('availability retorna slots e create appointment respeita idempotência', async ({
    request,
  }) => {
    const { accessToken } = await loginApi(request, 'owner@navalha.local');
    const headers = authHeaders(accessToken, LOCATION_NAVALHA);
    await ensureStaff(request, accessToken);

    const customerRes = await request.post(apiUrl('/customers'), {
      headers,
      data: { name: 'Cliente Agenda E2E', phone: randomPhone() },
    });
    expect(customerRes.status()).toBe(201);
    const customerId = dataOf((await customerRes.json()) as Record<string, unknown>).id as string;

    const publicLocation = await request.get(apiUrl(`/public/${TENANT_NAVALHA}/${LOCATION_SLUG}`));
    expect(publicLocation.status()).toBe(200);
    const locationData = dataOf((await publicLocation.json()) as Record<string, unknown>);
    const services = locationData.services as Array<{ id: string }>;
    expect(services.length).toBeGreaterThan(0);
    const serviceId = services[0]!.id;

    const from = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    let availability = await request.get(
      apiUrl(
        `/availability?locationId=${LOCATION_NAVALHA}&serviceIds=${serviceId}&from=${from}&to=${from}`,
      ),
      { headers },
    );
    expect(availability.status()).toBe(200);
    let slots = (dataOf((await availability.json()) as Record<string, unknown>).slots ??
      []) as Array<{ startsAt: string; staffId: string }>;

    if (slots.length === 0) {
      const publicAvailability = await request.get(
        apiUrl(`/public/${TENANT_NAVALHA}/${LOCATION_SLUG}/availability?serviceIds=${serviceId}&from=${from}&to=${from}`),
      );
      expect(publicAvailability.status()).toBe(200);
      slots = (dataOf((await publicAvailability.json()) as Record<string, unknown>).slots ??
        []) as Array<{ startsAt: string; staffId: string }>;
    }
    expect(slots.length).toBeGreaterThan(0);

    const slot = slots[0]!;
    const idempotencyKey = randomUUID();
    const createBody = {
      customerId,
      staffId: slot.staffId,
      serviceIds: [serviceId],
      startsAt: slot.startsAt,
      source: 'PANEL',
    };

    const created = await request.post(apiUrl('/appointments'), {
      headers: { ...headers, 'Idempotency-Key': idempotencyKey },
      data: createBody,
    });
    expect(created.status()).toBe(201);
    const appointmentId = dataOf((await created.json()) as Record<string, unknown>).id as string;

    const replay = await request.post(apiUrl('/appointments'), {
      headers: { ...headers, 'Idempotency-Key': idempotencyKey },
      data: createBody,
    });
    expect(replay.status()).toBe(201);
    expect(dataOf((await replay.json()) as Record<string, unknown>).id).toBe(appointmentId);
  });
});

test.describe('S2 — Booking público (API sem JWT)', () => {
  test('fluxo tenant → location → book → consulta mascarada → cancel', async ({ request }) => {
    const tenantRes = await request.get(apiUrl('/public/navalha'));
    expect(tenantRes.status()).toBe(200);
    const tenant = dataOf((await tenantRes.json()) as Record<string, unknown>);
    expect(Array.isArray(tenant.locations)).toBe(true);

    const locationRes = await request.get(apiUrl('/public/navalha/default'));
    expect(locationRes.status()).toBe(200);
    const location = dataOf((await locationRes.json()) as Record<string, unknown>);
    expect(location.bookingAvailable).toBe(true);

    const services = location.services as Array<{ id: string }>;
    const serviceId = services[0]!.id;
    const from = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const availabilityRes = await request.get(
      apiUrl(`/public/navalha/default/availability?serviceIds=${serviceId}&from=${from}&to=${from}`),
    );
    expect(availabilityRes.status()).toBe(200);
    const slots = (dataOf((await availabilityRes.json()) as Record<string, unknown>).slots ??
      []) as Array<{ startsAt: string; staffId: string }>;
    expect(slots.length).toBeGreaterThan(0);

    const phone = randomPhone();
    const bookRes = await request.post(apiUrl('/public/navalha/default/appointments'), {
      headers: { 'Idempotency-Key': randomUUID() },
      data: {
        serviceIds: [serviceId],
        staffId: slots[0]!.staffId,
        startsAt: slots[0]!.startsAt,
        customer: { name: 'Cliente Público E2E', phone },
        consentDataProcessing: true,
        consentWhatsappMarketing: false,
      },
    });
    expect(bookRes.status()).toBe(201);
    const booked = dataOf((await bookRes.json()) as Record<string, unknown>);
    const cancelToken = booked.cancelToken as string;
    expect(cancelToken).toBeTruthy();

    const masked = await request.get(
      apiUrl(`/public/navalha/default/appointments/${booked.id}?token=${cancelToken}`),
    );
    expect(masked.status()).toBe(200);
    const maskedData = dataOf((await masked.json()) as Record<string, unknown>);
    const customer = maskedData.customer as Record<string, unknown>;
    expect(customer.phoneMasked).toBeTruthy();
    expect(customer.phoneMasked).not.toBe(phone);

    const cancelled = await request.delete(
      apiUrl(`/public/navalha/default/appointments/${booked.id}?token=${cancelToken}`),
      { data: { reason: 'Desistência E2E' } },
    );
    expect(cancelled.status()).toBe(204);
  });

  test('slug inválido retorna 404', async ({ request }) => {
    const res = await request.get(apiUrl('/public/tenant-que-nao-existe'));
    expect(res.status()).toBe(404);
  });

  test('consent obrigatório retorna CONSENT_REQUIRED', async ({ request }) => {
    const locationRes = await request.get(apiUrl('/public/navalha/default'));
    const location = dataOf((await locationRes.json()) as Record<string, unknown>);
    const serviceId = (location.services as Array<{ id: string }>)[0]!.id;
    const from = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const availabilityRes = await request.get(
      apiUrl(`/public/navalha/default/availability?serviceIds=${serviceId}&from=${from}&to=${from}`),
    );
    const slots = (dataOf((await availabilityRes.json()) as Record<string, unknown>).slots ??
      []) as Array<{ startsAt: string; staffId: string }>;
    expect(slots.length).toBeGreaterThan(0);

    const res = await request.post(apiUrl('/public/navalha/default/appointments'), {
      headers: { 'Idempotency-Key': randomUUID() },
      data: {
        serviceIds: [serviceId],
        staffId: slots[0]!.staffId,
        startsAt: slots[0]!.startsAt,
        customer: { name: 'Sem Consent', phone: randomPhone() },
        consentDataProcessing: false,
      },
    });
    expect(res.status()).toBe(422);
    expect(errorCode((await res.json()) as Record<string, unknown>)).toBe('CONSENT_REQUIRED');
  });
});
