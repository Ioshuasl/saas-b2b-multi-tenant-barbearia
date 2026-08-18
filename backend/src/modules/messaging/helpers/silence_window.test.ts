import { describe, expect, it } from 'vitest';
import { applySilenceWindow } from './silence_window.js';

const TZ = 'America/Sao_Paulo';

describe('applySilenceWindow', () => {
  it('mantém horário fora da janela 21h–8h', () => {
    const sendAt = new Date('2026-08-18T15:00:00-03:00');
    expect(applySilenceWindow(sendAt, TZ).getTime()).toBe(sendAt.getTime());
  });

  it('adia 22h local para 08h do dia seguinte', () => {
    const result = applySilenceWindow(new Date('2026-08-18T22:00:00-03:00'), TZ);
    expect(result.toISOString()).toBe('2026-08-19T11:00:00.000Z');
  });

  it('adia 07h local para 08h no mesmo dia', () => {
    const result = applySilenceWindow(new Date('2026-08-18T07:00:00-03:00'), TZ);
    expect(result.toISOString()).toBe('2026-08-18T11:00:00.000Z');
  });
});
