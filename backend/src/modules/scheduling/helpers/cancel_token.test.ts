import { describe, expect, it } from 'vitest';
import {
  generateCancelToken,
  hashCancelToken,
  verifyCancelToken,
} from './cancel_token.js';

describe('cancel_token', () => {
  it('hash é determinístico e verify aceita token correto', () => {
    const token = generateCancelToken();
    const hash = hashCancelToken(token);
    expect(hash).toHaveLength(64);
    expect(verifyCancelToken(token, hash)).toBe(true);
  });

  it('verify rejeita token incorreto', () => {
    const hash = hashCancelToken(generateCancelToken());
    expect(verifyCancelToken(generateCancelToken(), hash)).toBe(false);
  });

  it('verify rejeita hash ausente', () => {
    expect(verifyCancelToken(generateCancelToken(), null)).toBe(false);
    expect(verifyCancelToken(generateCancelToken(), undefined)).toBe(false);
  });
});
