import { test, expect } from '@playwright/test';
import { locationSelect } from './helpers';

test.describe('Signup, wizard e convite', () => {
  test('cria barbearia, percorre 4 passos sem adicionar unidade e convida a equipe', async ({
    page,
  }) => {
    const suffix = Date.now().toString(36);
    const email = `aceite-${suffix}@signup.local`;
    const inviteEmail = `convite-${suffix}@signup.local`;

    await page.goto('/signup');
    await page.getByLabel('Nome da barbearia').fill(`Aceite ${suffix}`);
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Telefone').fill('11988887777');
    await page.getByLabel('Senha').fill(`Aceite-P@ss-${suffix}`);
    await page.getByRole('button', { name: 'Criar e entrar' }).click();

    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
    await page.getByRole('link', { name: 'Configurar loja' }).click();
    await expect(page).toHaveURL(/\/inicio/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Configurar loja' })).toBeVisible();
    await expect(page.getByRole('button', { name: /1\. Horários/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /2\. Serviços/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /3\. Profissionais/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /4\. Publicar/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nova unidade' })).toHaveCount(0);
    await expect(page.getByText(/adicionar unidade/i)).toHaveCount(0);
    await expect(locationSelect(page)).toHaveCount(0);

    await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('button', { name: 'Novo serviço' })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('button', { name: 'Novo profissional' })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Publicar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Atualizar publicação' })).toBeVisible();
    await expect(page.getByText('Rede:')).toBeVisible();

    await page.getByRole('link', { name: 'Equipe', exact: true }).click();
    await expect(page).toHaveURL(/\/configuracoes\/equipe/);
    await page.getByRole('button', { name: 'Convidar' }).click();
    await expect(page.getByRole('heading', { name: 'Novo convite' })).toBeVisible();
    await page.getByLabel('E-mail').fill(inviteEmail);
    await page.getByLabel('Papel').selectOption('STAFF');
    await page.locator('fieldset').getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'Enviar convite' }).click();
    await expect(page.getByText(inviteEmail)).toBeVisible();
  });
});
