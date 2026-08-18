import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'password',
      'refreshToken',
      'accessToken',
      'wrappedDek',
      'dek',
      'TENANT_KEK',
      'KEK_LOCAL_BASE64',
    ],
    remove: true,
  },
});
