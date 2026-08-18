import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomUUID } from 'node:crypto';
import { login } from './helpers';
import {
  apiUrl,
  authHeaders,
  loginApi,
  payloadOf,
  randomPhone,
} from './api-helpers';

const LOCATION_NAVALHA = '018f0000-0000-7000-8000-0000000000a1';
const LOCATION_CENTRO = '018f0000-0000-7000-8000-0000000000b1';
const LOCATION_JARDIM = '018f0000-0000-7000-8000-0000000000b2';
const STAFF_CARLOS = '018f0000-0000-7000-8000-0000000000b6';
const STAFF_RAFAEL = '018f0000-0000-7000-8000-0000000000b8';
const STAFF_DIEGO = '018f0000-0000-7000-8000-0000000000b7';

function uniqueName(prefix: string): string {
  const token = randomUUID().replace(/[0-9-]/g, '').slice(0, 10);
  return `${prefix} ${token}`;
}

type Json = Record<string, unknown>;
type Slot = { startsAt: string; staffId: string; staffName?: string };
type Service = { id: string; name: string; active?: boolean };

function dayKeySp(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(iso));
}

function rangeIso(): { from: string; to: string } {
  return {
    from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    to: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

async function jsonOf(res: { json: () => Promise<unknown> }): Promise<Json> {
  return (await res.json()) as Json;
}

async function listServices(
  request: Parameters<typeof loginApi>[0],
  token: string,
  locationId: string,
): Promise<Service[]> {
  const res = await request.get(apiUrl('/services'), { headers: authHeaders(token, locationId) });
  expect(res.status()).toBe(200);
  const data = payloadOf<Service[] | { items?: Service[] }>(await jsonOf(res));
  const items = Array.isArray(data) ? data : (data.items ?? []);
  return items.filter((item) => item.active !== false);
}

async function firstSlot(
  request: Parameters<typeof loginApi>[0],
  token: string,
  locationId: string,
  staffId?: string,
): Promise<{ slot: Slot; service: Service }> {
  const services = await listServices(request, token, locationId);
  expect(services.length).toBeGreaterThan(0);
  const service = services.find((item) => item.name === 'Corte') ?? services[0]!;
  const headers = authHeaders(token, locationId);

  for (let offset = 0; offset < 10; offset += 1) {
    const day = new Date(Date.now() + (2 + offset) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const staffQuery = staffId ? `&staffId=${staffId}` : '';
    const res = await request.get(
      apiUrl(
        `/availability?locationId=${locationId}&serviceIds=${service.id}&from=${day}&to=${day}${staffQuery}`,
      ),
      { headers },
    );
    expect(res.status()).toBe(200);
    const slots = payloadOf<{ slots?: Slot[] }>(await jsonOf(res)).slots ?? [];
    if (slots.length > 0) return { slot: slots[0]!, service };
  }

  throw new Error(`Nenhum slot livre em ${locationId}`);
}

async function createCustomer(
  request: Parameters<typeof loginApi>[0],
  token: string,
  locationId: string,
  name: string,
): Promise<{ id: string; name: string; phone: string }> {
  const phone = randomPhone();
  const res = await request.post(apiUrl('/customers'), {
    headers: authHeaders(token, locationId),
    data: { name, phone, marketingOptIn: false },
  });
  expect(res.status()).toBe(201);
  const customer = payloadOf<{ id: string; name: string; phone: string }>(await jsonOf(res));
  return { id: customer.id, name: customer.name, phone };
}

async function createAppointment(
  request: Parameters<typeof loginApi>[0],
  token: string,
  locationId: string,
  input: { customerId: string; staffId: string; serviceId: string; startsAt: string },
): Promise<string> {
  const res = await request.post(apiUrl('/appointments'), {
    headers: { ...authHeaders(token, locationId), 'Idempotency-Key': randomUUID() },
    data: {
      customerId: input.customerId,
      staffId: input.staffId,
      serviceIds: [input.serviceId],
      startsAt: input.startsAt,
      source: 'PANEL',
    },
  });
  expect(res.status()).toBe(201);
  return payloadOf<{ id: string }>(await jsonOf(res)).id;
}

test.describe('S3 — Painel agenda e clientes', () => {
  test('OWNER cria agendamento no painel e transita até COMPLETED', async ({ page, request }) => {
    const { accessToken } = await loginApi(request, 'owner@navalha.local');
    const customerName = uniqueName('Cliente Painel');
    await createCustomer(request, accessToken, LOCATION_NAVALHA, customerName);
    const { slot, service } = await firstSlot(request, accessToken, LOCATION_NAVALHA);
    const day = dayKeySp(slot.startsAt);

    await login(page, 'owner@navalha.local');
    await expect(page.getByRole('link', { name: 'Agenda' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Configurar loja' })).toBeVisible();

    await page.goto(`/?day=${day}`);
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
    await page.getByRole('button', { name: 'Novo agendamento' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Novo agendamento' })).toBeVisible();

    await dialog.getByRole('combobox', { name: 'Cliente' }).click();
    await dialog.getByRole('combobox', { name: 'Cliente' }).fill(customerName);
    await expect(dialog.getByRole('option', { name: customerName })).toBeVisible({ timeout: 15_000 });
    await dialog.getByRole('option', { name: customerName }).click();
    await dialog.getByLabel('Profissional').selectOption({ value: slot.staffId });
    await dialog.getByRole('checkbox', { name: service.name, exact: true }).check();
    const slotSelect = dialog.locator('#appointment-slot');
    await expect(slotSelect.locator(`option[value="${slot.startsAt}"]`)).toBeAttached({
      timeout: 20_000,
    });
    await slotSelect.selectOption(slot.startsAt);
    await dialog.getByRole('button', { name: 'Salvar' }).click();

    const card = page.getByRole('button', { name: new RegExp(customerName) });
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(card).toHaveAttribute('aria-label', /Agendado/);

    await card.dispatchEvent('click');
    const sidebar = page.locator('aside').filter({ hasText: 'Agendamento' });
    await expect(sidebar.getByRole('heading', { name: 'Agendamento' })).toBeVisible();

    async function transitionUi(label: string, aria: RegExp) {
      const pending = page.waitForResponse(
        (res) => res.url().includes('/status') && res.request().method() === 'POST',
        { timeout: 15_000 },
      );
      await sidebar.getByRole('button', { name: label, exact: true }).click();
      const res = await pending;
      expect(res.ok(), `POST status ${label}: ${res.status()} ${await res.text()}`).toBeTruthy();
      await expect(card).toHaveAttribute('aria-label', aria);
    }

    await transitionUi('Confirmado', /Confirmado/);
    await transitionUi('Em atendimento', /Em atendimento/);
    await transitionUi('Concluído', /Concluído/);
  });

  test('STAFF vê só a própria coluna e appointments', async ({ page, request }) => {
    const owner = await loginApi(request, 'owner@cortefino.local');
    const customerCarlos = await createCustomer(
      request,
      owner.accessToken,
      LOCATION_CENTRO,
      uniqueName('S3 Carlos'),
    );
    const customerRafael = await createCustomer(
      request,
      owner.accessToken,
      LOCATION_CENTRO,
      uniqueName('S3 Rafael'),
    );
    const slotCarlos = await firstSlot(request, owner.accessToken, LOCATION_CENTRO, STAFF_CARLOS);
    const slotRafael = await firstSlot(request, owner.accessToken, LOCATION_CENTRO, STAFF_RAFAEL);
    await createAppointment(request, owner.accessToken, LOCATION_CENTRO, {
      customerId: customerCarlos.id,
      staffId: STAFF_CARLOS,
      serviceId: slotCarlos.service.id,
      startsAt: slotCarlos.slot.startsAt,
    });
    await createAppointment(request, owner.accessToken, LOCATION_CENTRO, {
      customerId: customerRafael.id,
      staffId: STAFF_RAFAEL,
      serviceId: slotRafael.service.id,
      startsAt: slotRafael.slot.startsAt,
    });

    const staff = await loginApi(request, 'barbeiro@cortefino.local');
    const meRes = await request.get(apiUrl('/auth/me'), {
      headers: authHeaders(staff.accessToken, LOCATION_CENTRO),
    });
    expect(meRes.status()).toBe(200);
    expect(payloadOf<{ staffId: string | null }>(await jsonOf(meRes)).staffId).toBe(STAFF_CARLOS);

    const { from, to } = rangeIso();
    const listRes = await request.get(
      apiUrl(`/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&locationId=${LOCATION_CENTRO}`),
      { headers: authHeaders(staff.accessToken, LOCATION_CENTRO) },
    );
    expect(listRes.status()).toBe(200);
    const items = payloadOf<Array<{ staffId: string; customerName: string }>>(await jsonOf(listRes));
    expect(items.every((item) => item.staffId === STAFF_CARLOS)).toBe(true);
    expect(items.some((item) => item.customerName === customerCarlos.name)).toBe(true);
    expect(items.some((item) => item.customerName === customerRafael.name)).toBe(false);

    await login(page, 'barbeiro@cortefino.local');
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
    await expect(page.getByText('Seus atendimentos do dia.')).toBeVisible();
    await expect(page.getByText('Carlos', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Rafael', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Configurar loja' })).toHaveCount(0);
  });

  test('MANAGER Centro não vê appointment de Jardim', async ({ request }) => {
    const owner = await loginApi(request, 'owner@cortefino.local');
    const customer = await createCustomer(
      request,
      owner.accessToken,
      LOCATION_JARDIM,
      uniqueName('S3 Jardim'),
    );
    const { slot, service } = await firstSlot(request, owner.accessToken, LOCATION_JARDIM, STAFF_DIEGO);
    const appointmentId = await createAppointment(request, owner.accessToken, LOCATION_JARDIM, {
      customerId: customer.id,
      staffId: STAFF_DIEGO,
      serviceId: service.id,
      startsAt: slot.startsAt,
    });

    const manager = await loginApi(request, 'gerente@cortefino.local');
    const forbiddenHeader = await request.get(apiUrl(`/appointments/${appointmentId}`), {
      headers: authHeaders(manager.accessToken, LOCATION_JARDIM),
    });
    expect(forbiddenHeader.status()).toBe(404);

    const getRes = await request.get(apiUrl(`/appointments/${appointmentId}`), {
      headers: authHeaders(manager.accessToken, LOCATION_CENTRO),
    });
    expect(getRes.status()).toBe(404);

    const { from, to } = rangeIso();
    const listRes = await request.get(
      apiUrl(`/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&locationId=${LOCATION_CENTRO}`),
      { headers: authHeaders(manager.accessToken, LOCATION_CENTRO) },
    );
    expect(listRes.status()).toBe(200);
    const items = payloadOf<Array<{ id: string }>>(await jsonOf(listRes));
    expect(items.some((item) => item.id === appointmentId)).toBe(false);
  });

  test('busca cliente e abre ficha com histórico', async ({ page, request }) => {
    const { accessToken } = await loginApi(request, 'owner@navalha.local');
    const name = uniqueName('Ficha Painel');
    const customer = await createCustomer(request, accessToken, LOCATION_NAVALHA, name);
    const { slot, service } = await firstSlot(request, accessToken, LOCATION_NAVALHA);
    await createAppointment(request, accessToken, LOCATION_NAVALHA, {
      customerId: customer.id,
      staffId: slot.staffId,
      serviceId: service.id,
      startsAt: slot.startsAt,
    });

    await login(page, 'owner@navalha.local');
    await page.getByRole('link', { name: 'Clientes' }).click();
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible();
    await page.getByLabel('Buscar por nome ou telefone').fill(name);
    await expect(page.getByRole('link', { name })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name }).click();
    await expect(page.getByRole('heading', { name })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Histórico' })).toBeVisible();
    await expect(page.getByText(/Total gasto/)).toBeVisible();
  });

  test('axe-core: zero violação crítica em /, /agenda e /clientes', async ({ page }) => {
    await login(page, 'owner@navalha.local');

    for (const path of ['/', '/agenda', '/clientes']) {
      await page.goto(path);
      await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      const critical = results.violations.filter((item) => item.impact === 'critical');
      expect(critical, `violações críticas em ${path}: ${JSON.stringify(critical)}`).toEqual([]);
    }
  });
});
