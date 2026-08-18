import { Router } from 'express';
import type { ApiSuccess } from '@repo/contracts';
import { checkReadiness } from '../shared/database/health.js';

export const healthRoutes: Router = Router();

healthRoutes.get('/health', (_req, res) => {
  const body: ApiSuccess<{ status: 'ok'; service: string }> = {
    data: { status: 'ok', service: 'api' },
  };
  res.status(200).json(body);
});

healthRoutes.get('/ready', (_req, res, next) => {
  void checkReadiness()
    .then((ready) => {
      const body: ApiSuccess<typeof ready> = { data: ready };
      res.status(ready.status === 'ok' ? 200 : 503).json(body);
    })
    .catch(next);
});
