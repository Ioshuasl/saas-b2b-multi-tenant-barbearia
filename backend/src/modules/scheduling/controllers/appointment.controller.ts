import type { Request, Response } from 'express';
import { AppError } from '../../../shared/domain/errors.js';
import { parseBody, parseQuery } from '../helpers/http_parse.js';
import { requireAuth } from '../helpers/require_auth.js';
import { requireCtx } from '../helpers/require_ctx.js';
import {
  appointmentCancelSchema,
  appointmentCreateSchema,
  appointmentListQuerySchema,
  appointmentStatusSchema,
  appointmentUpdateSchema,
} from '../schemas/appointment.schema.js';
import { availabilityQuerySchema } from '../schemas/availability.schema.js';
import type { CreateService } from '../services/appointment/appointment_create.service.js';
import type { ListService as AppointmentListService } from '../services/appointment/appointment_list.service.js';
import type { GetService } from '../services/appointment/appointment_get.service.js';
import type { UpdateService } from '../services/appointment/appointment_update.service.js';
import type { StatusService } from '../services/appointment/appointment_status.service.js';
import type { DeleteService } from '../services/appointment/appointment_delete.service.js';
import type { HistoryListService } from '../services/appointment/appointment_history_list.service.js';
import type { ListService as AvailabilityListService } from '../services/availability/availability_list.service.js';

export class AppointmentController {
  constructor(
    private readonly availabilityListService: AvailabilityListService,
    private readonly listService: AppointmentListService,
    private readonly createService: CreateService,
    private readonly getService: GetService,
    private readonly updateService: UpdateService,
    private readonly statusService: StatusService,
    private readonly deleteService: DeleteService,
    private readonly historyListService: HistoryListService,
  ) {}

  async availability(req: Request, res: Response): Promise<void> {
    const query = parseQuery(availabilityQuerySchema, req.query);
    const auth = requireAuth(req);
    const result = await this.availabilityListService.execute(requireCtx(req), query, auth.staffId);
    res.status(200).json({ data: result });
  }

  async list(req: Request, res: Response): Promise<void> {
    const query = parseQuery(appointmentListQuerySchema, req.query);
    const auth = requireAuth(req);
    const items = await this.listService.execute(requireCtx(req), query, auth.staffId);
    res.status(200).json({ data: items });
  }

  async create(req: Request, res: Response): Promise<void> {
    const appointmentSchema = parseBody(appointmentCreateSchema, req.body);
    const auth = requireAuth(req);
    const idempotencyKey = req.header('idempotency-key') ?? req.header('Idempotency-Key');
    const appointment = await this.createService.execute(requireCtx(req), appointmentSchema, {
      idempotencyKey: idempotencyKey ?? '',
      actorStaffId: auth.staffId,
    });
    res.status(201).json({ data: appointment });
  }

  async get(req: Request, res: Response): Promise<void> {
    const appointmentId = req.params.id;
    if (!appointmentId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const auth = requireAuth(req);
    const appointment = await this.getService.execute(requireCtx(req), appointmentId, auth.staffId);
    res.status(200).json({ data: appointment });
  }

  async update(req: Request, res: Response): Promise<void> {
    const appointmentId = req.params.id;
    if (!appointmentId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const appointmentSchema = parseBody(appointmentUpdateSchema, req.body);
    const auth = requireAuth(req);
    const appointment = await this.updateService.execute(
      requireCtx(req),
      appointmentId,
      appointmentSchema,
      auth.staffId,
    );
    res.status(200).json({ data: appointment });
  }

  async status(req: Request, res: Response): Promise<void> {
    const appointmentId = req.params.id;
    if (!appointmentId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const appointmentSchema = parseBody(appointmentStatusSchema, req.body);
    const auth = requireAuth(req);
    const appointment = await this.statusService.execute(
      requireCtx(req),
      appointmentId,
      appointmentSchema,
      auth.staffId,
    );
    res.status(200).json({ data: appointment });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const appointmentId = req.params.id;
    if (!appointmentId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const appointmentSchema = parseBody(appointmentCancelSchema, req.body);
    const auth = requireAuth(req);
    await this.deleteService.execute(
      requireCtx(req),
      appointmentId,
      appointmentSchema,
      auth.staffId,
    );
    res.status(204).send();
  }

  async history(req: Request, res: Response): Promise<void> {
    const appointmentId = req.params.id;
    if (!appointmentId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const auth = requireAuth(req);
    const items = await this.historyListService.execute(
      requireCtx(req),
      appointmentId,
      auth.staffId,
    );
    res.status(200).json({ data: items });
  }
}
