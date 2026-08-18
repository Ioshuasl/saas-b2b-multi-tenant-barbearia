import type { Router } from 'express';
import { LocationController } from './controllers/location.controller.js';
import { GetRepository } from './repositories/location/location_get.repository.js';
import { buildLocationRoutes } from './routes/v1/location.routes.js';
import { GetService } from './services/location/location_get.service.js';

export function buildLocationsRouter(): Router {
  const getRepository = new GetRepository();
  const getService = new GetService(getRepository);
  const controller = new LocationController(getService);
  return buildLocationRoutes(controller);
}
