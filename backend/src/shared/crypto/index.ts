import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { KeyManagementPort } from './key_management.port.js';
import {
  LocalKeyManagementAdapter,
  resolveKekBytes,
} from './local_key_management.adapter.js';

let singleton: KeyManagementPort | undefined;

export function getKeyManagement(): KeyManagementPort {
  if (!singleton) {
    if (!env.KEK_LOCAL_BASE64 && !env.TENANT_KEK && env.NODE_ENV !== 'production') {
      logger.warn(
        'KEK ausente — usando KEK de desenvolvimento (não use em produção)',
      );
    }
    const kek = resolveKekBytes(env.KEK_LOCAL_BASE64, env.TENANT_KEK, env.NODE_ENV);
    singleton = new LocalKeyManagementAdapter(kek);
  }
  return singleton;
}

export type { KeyManagementPort } from './key_management.port.js';
export { LocalKeyManagementAdapter } from './local_key_management.adapter.js';
export { resolveKekBytes } from './local_key_management.adapter.js';
