import { test, expect, type Page } from '@playwright/test';

const PASSWORD = 'Devpass10!';

export async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Carregando sessão…')).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
}

export function locationSelect(page: Page) {
  return page.getByRole('combobox', { name: 'Unidade' });
}
