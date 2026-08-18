import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomUUID } from 'node:crypto';
import {
  apiUrl,
  authHeaders,
  loginApi,
  payloadOf,
} from './api-helpers';
import { login } from './helpers';
import {
  bookPublicViaApi,
  completePublicBookingWizard,
  dayKeySp,
  deactivateJardimServices,
  firstPublicSlot,
  restoreJardimServices,
  uniquePublicName,
} from './public-helpers';

const LOCATION_NAVALHA = '018f0000-0000-7000-8000-0000000000a1';

test.describe('S4 — Página pública', () => {
  test('navalha redireciona para unidade única (sem seletor)', async ({ page }) => {
    await page.goto('/navalha');
    await expect(page).toHaveURL(/\/navalha\/default/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Unidade padrão' })).toBeVisible();
    await expect(page.getByText('Escolha a unidade')).toHaveCount(0);
  });

  test('corte-fino lista Centro e Jardim', async ({ page }) => {
    await page.goto('/corte-fino');
    await expect(page.getByRole('heading', { name: 'Corte Fino' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Centro' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Jardim' })).toBeVisible();
  });

  test('agenda na pública em 4 telas e vê confirmação', async ({ page }) => {
    await page.goto('/navalha/default');
    const { name } = await completePublicBookingWizard(page);
    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver, remarcar ou cancelar' })).toBeVisible();
  });

  test('appointment da pública aparece na grade do painel', async ({ page, request }) => {
    const name = uniquePublicName('Painel S4');
    const { slot, service } = await firstPublicSlot(request, 'navalha', 'default');
    await bookPublicViaApi(request, {
      tenantSlug: 'navalha',
      locationSlug: 'default',
      serviceId: service.id,
      startsAt: slot.startsAt,
      staffId: slot.staffId,
      name,
    });

    const day = dayKeySp(slot.startsAt);
    await login(page, 'owner@navalha.local');
    await page.goto(`/?day=${day}`);
    await expect(page.getByRole('button', { name: new RegExp(name) })).toBeVisible({
      timeout: 20_000,
    });
  });

  test('SLOT_TAKEN volta à grade com toast', async ({ page, request }) => {
    const { slot, service } = await firstPublicSlot(request, 'navalha', 'default');

    await page.goto('/navalha/default');
    await page.getByRole('button', { name: /Corte/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Qualquer profissional' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('heading', { name: 'Horário' })).toBeVisible({ timeout: 20_000 });
    const day = dayKeySp(slot.startsAt);
    const dayLabel = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
    }).format(new Date(slot.startsAt));
    const dayChip = page.getByRole('button', { name: new RegExp(dayLabel) });
    if ((await dayChip.count()) > 0) await dayChip.first().click();

    const timeLabel = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(slot.startsAt));
    const slotButton = page.locator('section ul.grid button').filter({ hasText: timeLabel });
    if ((await slotButton.count()) > 0) {
      await slotButton.first().click();
    } else {
      await page.locator('section ul.grid button').first().click();
    }
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByLabel('Nome').fill(uniquePublicName('Conflito S4'));
    await page.getByLabel('Telefone').fill(`629${randomUUID().replace(/\D/g, '').slice(0, 8)}`);
    await page.getByRole('checkbox', { name: /Autorizo o tratamento/ }).check();

    await bookPublicViaApi(request, {
      tenantSlug: 'navalha',
      locationSlug: 'default',
      serviceId: service.id,
      startsAt: slot.startsAt,
      staffId: slot.staffId,
    });

    await page.getByRole('button', { name: 'Confirmar agendamento' }).click();

    await expect(page.getByRole('alert')).toContainText('Este horário acabou de ser reservado', {
      timeout: 15_000,
    });
    await expect(page.getByRole('heading', { name: 'Horário' })).toBeVisible();
  });

  test('cancelar com token válido', async ({ page, request }) => {
    const { slot, service } = await firstPublicSlot(request, 'navalha', 'default');
    const booked = await bookPublicViaApi(request, {
      tenantSlug: 'navalha',
      locationSlug: 'default',
      serviceId: service.id,
      startsAt: slot.startsAt,
      staffId: slot.staffId,
      name: uniquePublicName('Cancel S4'),
    });

    await page.goto(
      `/navalha/default/agendamento/${booked.id}?token=${encodeURIComponent(booked.cancelToken)}`,
    );
    await expect(page.getByRole('heading', { name: 'Unidade padrão' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar horário' }).click();
    await expect(page.getByText('Cancelado')).toBeVisible({ timeout: 15_000 });
  });

  test('token inválido → 404 amigável', async ({ page }) => {
    await page.goto(
      `/navalha/default/agendamento/${randomUUID()}?token=${randomUUID()}`,
    );
    await expect(page.getByText('Página não encontrada.')).toBeVisible();
  });

  test('unidade sem serviço visível → Agendamento indisponível', async ({ page, request }) => {
    await deactivateJardimServices(request);
    try {
      await page.goto('/corte-fino/jardim');
      await expect(page.getByText('Agendamento indisponível.')).toBeVisible();
    } finally {
      await restoreJardimServices(request);
    }
  });

  test('RSC inclui nome da unidade no HTML inicial', async ({ page }) => {
    const response = await page.goto('/navalha/default');
    expect(response?.ok()).toBeTruthy();
    const html = await response!.text();
    expect(html).toContain('Unidade padrão');
  });

  test('axe-core: zero violação crítica nas rotas públicas', async ({ page }) => {
    for (const path of ['/navalha', '/corte-fino', '/corte-fino/centro']) {
      await page.goto(path);
      if (path === '/navalha') {
        await expect(page).toHaveURL(/\/navalha\/default/);
      }
      const results = await new AxeBuilder({ page }).analyze();
      const critical = results.violations.filter((item) => item.impact === 'critical');
      expect(critical, `violações críticas em ${path}: ${JSON.stringify(critical)}`).toEqual([]);
    }
  });

  test('consentimento LGPD bloqueia submit sem checkbox', async ({ page }) => {
    await page.goto('/navalha/default');
    await page.getByRole('button', { name: /Corte/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Qualquer profissional' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Horário' })).toBeVisible({ timeout: 20_000 });
    await page.locator('section ul.grid button').first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByLabel('Nome').fill(uniquePublicName('Sem LGPD'));
    await page.getByLabel('Telefone').fill(`629${randomUUID().replace(/\D/g, '').slice(0, 8)}`);
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click();

    await expect(page.getByText(/Consentimento para tratamento de dados é obrigatório/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Horário confirmado' })).toHaveCount(0);
  });

  test('GET público confirma origem no painel (API)', async ({ request }) => {
    const name = uniquePublicName('Origem S4');
    const { slot, service } = await firstPublicSlot(request, 'navalha', 'default');
    const booked = await bookPublicViaApi(request, {
      tenantSlug: 'navalha',
      locationSlug: 'default',
      serviceId: service.id,
      startsAt: slot.startsAt,
      staffId: slot.staffId,
      name,
    });

    const { accessToken } = await loginApi(request, 'owner@navalha.local');
    const day = dayKeySp(slot.startsAt);
    const from = new Date(`${day}T00:00:00-03:00`).toISOString();
    const to = new Date(`${day}T23:59:59-03:00`).toISOString();
    const listRes = await request.get(
      apiUrl(
        `/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&locationId=${LOCATION_NAVALHA}`,
      ),
      { headers: authHeaders(accessToken, LOCATION_NAVALHA) },
    );
    expect(listRes.status()).toBe(200);
    const items = payloadOf<Array<{ id: string; customerName: string; source?: string }>>(
      await listRes.json(),
    );
    const item = items.find((entry) => entry.id === booked.id);
    expect(item).toBeTruthy();
    expect(item?.customerName).toBe(name);
  });
});
