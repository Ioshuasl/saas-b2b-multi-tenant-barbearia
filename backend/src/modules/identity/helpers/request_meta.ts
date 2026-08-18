import type { Request } from 'express';
import { clientIp } from '../../../shared/middlewares/rate_limit.middleware.js';
import type { RequestMeta } from '../types/auth/request_meta.types.js';

export function requestMeta(req: Request): RequestMeta {
  return {
    requestId: req.requestId,
    ipAddress: clientIp(req),
    userAgent: req.header('user-agent'),
  };
}
