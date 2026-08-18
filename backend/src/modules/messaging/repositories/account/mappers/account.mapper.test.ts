import { describe, expect, it } from 'vitest';
import { buildSessionName } from './account.mapper.js';

describe('buildSessionName', () => {
  it('remove hífens do tenant id', () => {
    expect(buildSessionName('018f0000-0000-7000-8000-00000000000a')).toBe(
      'tenant_018f000000007000800000000000000a',
    );
  });
});
