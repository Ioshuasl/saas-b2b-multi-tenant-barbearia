import { test, expect } from '@playwright/test';
import { locationSelect, login } from './helpers';

test.describe('Seletor de unidade (RF-E2-02)', () => {
  test('loja única (Navalha) não mostra seletor', async ({ page }) => {
    await login(page, 'owner@navalha.local');
    await expect(locationSelect(page)).toHaveCount(0);
  });

  test('rede (Corte Fino OWNER) mostra seletor com as duas unidades', async ({ page }) => {
    await login(page, 'owner@cortefino.local');
    const select = locationSelect(page);
    await expect(select).toBeVisible();
    await expect(select.locator('option')).toHaveCount(2);
  });

  test('MANAGER com uma unidade no escopo não mostra seletor', async ({ page }) => {
    await login(page, 'gerente@cortefino.local');
    await expect(locationSelect(page)).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Equipe', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Unidades', exact: true })).toBeVisible();
  });
});
