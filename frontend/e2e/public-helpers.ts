import { expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
  apiUrl,
  authHeaders,
  loginApi,
  payloadOf,
  randomPhone,
} from './api-helpers';

const LOCATION_JARDIM = '018f0000-0000-7000-8000-0000000000b2';

type Slot = { startsAt: string; staffId: string };
type PublicService = { id: string; name: string };

export function uniquePublicName(prefix: string): string {
  const token = randomUUID().replace(/[0-9-]/g, '').slice(0, 8);
  return `${prefix} ${token}`;
}

export function dayKeySp(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(iso));
}

export async function firstPublicSlot(
  request: Parameters<typeof loginApi>[0],
  tenantSlug: string,
  locationSlug: string,
): Promise<{ slot: Slot; service: PublicService }> {
  const locationRes = await request.get(apiUrl(`/public/${tenantSlug}/${locationSlug}`));
  expect(locationRes.status()).toBe(200);
  const location = payloadOf<{ services: PublicService[] }>(await locationRes.json());
  const service = location.services.find((item) => item.name === 'Corte') ?? location.services[0]!;
  expect(service).toBeTruthy();

  for (let offset = 0; offset < 12; offset += 1) {
    const day = new Date(Date.now() + (3 + offset) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const res = await request.get(
      apiUrl(`/public/${tenantSlug}/${locationSlug}/availability?serviceIds=${service.id}&from=${day}&to=${day}`),
    );
    expect(res.status()).toBe(200);
    const slots = payloadOf<{ slots?: Slot[] }>(await res.json()).slots ?? [];
    if (slots.length > 0) return { slot: slots[0]!, service };
  }
  throw new Error(`Nenhum slot público em /${tenantSlug}/${locationSlug}`);
}

export async function bookPublicViaApi(
  request: Parameters<typeof loginApi>[0],
  input: {
    tenantSlug: string;
    locationSlug: string;
    serviceId: string;
    startsAt: string;
    staffId: string;
    phone?: string;
    name?: string;
  },
): Promise<{ id: string; cancelToken: string; startsAt: string }> {
  const phone = input.phone ?? randomPhone();
  const res = await request.post(
    apiUrl(`/public/${input.tenantSlug}/${input.locationSlug}/appointments`),
    {
      headers: { 'Idempotency-Key': randomUUID() },
      data: {
        serviceIds: [input.serviceId],
        staffId: input.staffId,
        startsAt: input.startsAt,
        customer: { name: input.name ?? 'Cliente API S4', phone },
        consentDataProcessing: true,
        consentWhatsappMarketing: false,
      },
    },
  );
  expect(res.status()).toBe(201);
  const body = payloadOf<{ id: string; cancelToken: string; startsAt: string }>(await res.json());
  return body;
}

export async function deactivateJardimServices(
  request: Parameters<typeof loginApi>[0],
): Promise<void> {
  const { accessToken } = await loginApi(request, 'owner@cortefino.local');
  const headers = authHeaders(accessToken, LOCATION_JARDIM);
  const servicesRes = await request.get(apiUrl('/services'), { headers });
  expect(servicesRes.status()).toBe(200);
  const services = payloadOf<Array<{ id: string }> | { items?: Array<{ id: string }> }>(
    await servicesRes.json(),
  );
  const items = Array.isArray(services) ? services : (services.items ?? []);
  for (const service of items) {
    const res = await request.put(apiUrl(`/locations/${LOCATION_JARDIM}/services/${service.id}`), {
      headers,
      data: { active: false },
    });
    expect(res.status()).toBe(200);
  }
}

export async function restoreJardimServices(
  request: Parameters<typeof loginApi>[0],
): Promise<void> {
  const { accessToken } = await loginApi(request, 'owner@cortefino.local');
  const headers = authHeaders(accessToken, LOCATION_JARDIM);
  const servicesRes = await request.get(apiUrl('/services'), { headers });
  expect(servicesRes.status()).toBe(200);
  const services = payloadOf<Array<{ id: string }> | { items?: Array<{ id: string }> }>(
    await servicesRes.json(),
  );
  const items = Array.isArray(services) ? services : (services.items ?? []);
  for (const service of items) {
    await request.put(apiUrl(`/locations/${LOCATION_JARDIM}/services/${service.id}`), {
      headers,
      data: { active: true },
    });
  }
}

export async function completePublicBookingWizard(
  page: Page,
  input?: { name?: string; phone?: string; serviceName?: string },
): Promise<{ name: string; phone: string }> {
  const name = input?.name ?? uniquePublicName('Cliente S4');
  const phone = input?.phone ?? randomPhone();
  const servicePattern = input?.serviceName ?? 'Corte';

  await expect(page.getByRole('heading', { name: 'Serviço' })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(servicePattern) }).first().click();
  await page.getByRole('button', { name: 'Continuar' }).click();

  await expect(page.getByRole('heading', { name: 'Profissional' })).toBeVisible();
  await page.getByRole('button', { name: 'Qualquer profissional' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();

  await expect(page.getByRole('heading', { name: 'Horário' })).toBeVisible({ timeout: 20_000 });
  const slot = page.locator('section ul.grid button').first();
  await expect(slot).toBeVisible({ timeout: 20_000 });
  await slot.click();
  await page.getByRole('button', { name: 'Continuar' }).click();

  await expect(page.getByRole('heading', { name: 'Seus dados' })).toBeVisible();
  await page.getByLabel('Nome').fill(name);
  await page.getByLabel('Telefone').fill(phone);
  await page.getByRole('checkbox', { name: /Autorizo o tratamento/ }).check();
  await page.getByRole('button', { name: 'Confirmar agendamento' }).click();

  await expect(page.getByRole('heading', { name: 'Horário confirmado' })).toBeVisible({
    timeout: 20_000,
  });
  return { name, phone };
}
