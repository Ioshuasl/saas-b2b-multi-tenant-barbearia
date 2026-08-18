import type { Request, Response } from 'express';
import { AppError } from '../../../shared/domain/errors.js';
import type { GetService } from '../services/location/location_get.service.js';

export class LocationController {
  constructor(private readonly getService: GetService) {}

  async get(req: Request, res: Response): Promise<void> {
    const ctx = req.ctx;
    if (!ctx) {
      throw new AppError('UNAUTHENTICATED', 'Contexto de autenticação ausente.', 401);
    }
    const locationId = req.params.id;
    if (!locationId) {
      throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    }
    const location = await this.getService.execute(ctx, locationId);
    res.status(200).json({ data: location });
  }
}
