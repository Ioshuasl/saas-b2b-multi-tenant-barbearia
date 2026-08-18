import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { completePublicBookingWizard } from './public-helpers';

test.describe('S5 — WhatsApp e notificações', () => {
  test('fluxo 10: checkbox de ciência antes do QR', async ({ page }) => {
    await login(page, 'owner@cortefino.local');
    await page.goto('/configuracoes/whatsapp');

    await expect(page.getByRole('heading', { name: 'Mensagens' })).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeVisible();
    await expect(page.getByText('Estou ciente de que este canal não é o aplicativo oficial da Meta')).toBeVisible();
    await expect(page.getByText(/WhatsApp oficial/i)).toHaveCount(0);
    await expect(page.getByAltText('QR para conectar o número dedicado')).toHaveCount(0);

    await page.getByRole('button', { name: 'Conectar número' }).click();
    await expect(page.getByText('Confirme a ciência de risco antes de conectar.')).toBeVisible();
    await expect(page.getByAltText('QR para conectar o número dedicado')).toHaveCount(0);

    if (process.env.MESSAGING_PROVIDER === 'fake') {
      await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: 'Conectar número' }).click();
      await expect(page.getByAltText('QR para conectar o número dedicado')).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test('fluxo 11: sessão desconectada ainda agenda e mostra banner', async ({ page }) => {
    await login(page, 'owner@cortefino.local');
    await expect(page.getByRole('status')).toContainText('Canal de mensagens desconectado');
    await expect(page.getByRole('link', { name: 'Reconectar' })).toBeVisible();

    await page.goto('/corte-fino/centro');
    await completePublicBookingWizard(page);
    await expect(page.getByRole('heading', { name: 'Horário confirmado' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver, remarcar ou cancelar' })).toBeVisible();
  });

  test('navalha conectada não mostra banner de sessão caída', async ({ page }) => {
    test.skip(process.env.MESSAGING_PROVIDER === 'fake', 'CI fake não vincula sessão WAHA ao Navalha');
    await login(page, 'owner@navalha.local');
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await page.goto('/configuracoes/whatsapp');
    await expect(page.getByText('Conectado')).toBeVisible();
  });
});
