import type { Request, Response } from 'express';
import { AppError } from '../../../shared/domain/errors.js';
import { parseBody } from '../helpers/http_parse.js';
import { requireCtx } from '../helpers/require_ctx.js';
import {
  locationServiceUpsertSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
} from '../schemas/service.schema.js';
import type { ListService } from '../services/service/service_list.service.js';
import type { CreateService } from '../services/service/service_create.service.js';
import type { UpdateService } from '../services/service/service_update.service.js';
import type { UpsertLocationService } from '../services/service/service_upsert_location.service.js';

export class ServiceController {
  constructor(
    private readonly listService: ListService,
    private readonly createService: CreateService,
    private readonly updateService: UpdateService,
    private readonly upsertLocationService: UpsertLocationService,
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const services = await this.listService.execute(requireCtx(req));
    res.status(200).json({ data: services });
  }

  async create(req: Request, res: Response): Promise<void> {
    const serviceSchema = parseBody(serviceCreateSchema, req.body);
    const service = await this.createService.execute(requireCtx(req), serviceSchema);
    res.status(201).json({ data: service });
  }

  async update(req: Request, res: Response): Promise<void> {
    const serviceId = req.params.id;
    if (!serviceId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const serviceSchema = parseBody(serviceUpdateSchema, req.body);
    const service = await this.updateService.execute(requireCtx(req), serviceId, serviceSchema);
    res.status(200).json({ data: service });
  }

  async upsertLocation(req: Request, res: Response): Promise<void> {
    const locationId = req.params.id;
    const serviceId = req.params.serviceId;
    if (!locationId || !serviceId) {
      throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    }
    const locationServiceSchema = parseBody(locationServiceUpsertSchema, req.body);
    await this.upsertLocationService.execute(
      requireCtx(req),
      locationId,
      serviceId,
      locationServiceSchema,
    );
    res.status(200).json({ data: { ok: true } });
  }
}
