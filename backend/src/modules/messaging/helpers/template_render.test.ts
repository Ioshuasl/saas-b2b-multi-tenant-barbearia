import { describe, expect, it } from 'vitest';
import {
  buildCancelLink,
  buildTemplateVariables,
  formatLocalDateTime,
  renderTemplate,
} from './template_render.js';

describe('renderTemplate', () => {
  it('substitui variáveis conhecidas', () => {
    expect(renderTemplate('Olá {{customerName}} na {{locationName}}', {
      customerName: 'Ana',
      locationName: 'Navalha',
    })).toBe('Olá Ana na Navalha');
  });

  it('variável ausente vira string vazia', () => {
    expect(renderTemplate('x={{missing}}y', {})).toBe('x=y');
  });
});

describe('formatLocalDateTime', () => {
  it('formata no fuso da unidade', () => {
    const formatted = formatLocalDateTime('2026-08-18T18:00:00.000Z', 'America/Sao_Paulo');
    expect(formatted).toMatch(/18\/08\/2026/);
    expect(formatted).toMatch(/15:00/);
  });
});

describe('buildCancelLink', () => {
  it('usa cancelLink explícito', () => {
    expect(
      buildCancelLink({
        appPublicUrl: 'http://localhost:3000',
        tenantSlug: 'navalha',
        locationSlug: 'default',
        cancelLink: 'http://localhost:3000/cancelar',
      }),
    ).toBe('http://localhost:3000/cancelar');
  });

  it('monta URL pública quando não há link', () => {
    expect(
      buildCancelLink({
        appPublicUrl: 'http://localhost:3000/',
        tenantSlug: 'navalha',
        locationSlug: 'default',
      }),
    ).toBe('http://localhost:3000/public/navalha/default');
  });
});

describe('buildTemplateVariables', () => {
  it('expõe as chaves dos templates pt-BR', () => {
    const vars = buildTemplateVariables({
      customerName: 'Ana',
      locationName: 'Navalha',
      startsAt: '2026-08-18T18:00:00.000Z',
      timezone: 'America/Sao_Paulo',
      cancelLink: 'http://localhost:3000/c',
    });
    expect(vars.customerName).toBe('Ana');
    expect(vars.locationName).toBe('Navalha');
    expect(vars.cancelLink).toBe('http://localhost:3000/c');
    expect(vars.startsAtLocal).toMatch(/15:00/);
  });
});
