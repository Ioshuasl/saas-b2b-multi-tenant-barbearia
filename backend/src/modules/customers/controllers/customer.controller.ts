import type { Request, Response } from 'express';
import { AppError } from '../../../shared/domain/errors.js';
import { parseBody, parseQuery } from '../helpers/http_parse.js';
import { requireCtx } from '../helpers/require_ctx.js';
import { requestMeta } from '../helpers/request_meta.js';
import {
  customerCreateSchema,
  customerDuplicateQuerySchema,
  customerListQuerySchema,
  customerUpdateSchema,
} from '../schemas/customer.schema.js';
import type { CreateService } from '../services/customer/customer_create.service.js';
import type { ListService } from '../services/customer/customer_list.service.js';
import type { GetService } from '../services/customer/customer_get.service.js';
import type { UpdateService } from '../services/customer/customer_update.service.js';
import type { DeleteService } from '../services/customer/customer_delete.service.js';
import type { CheckDuplicateService } from '../services/customer/customer_check_duplicate.service.js';
import type { AppointmentsListService } from '../services/customer/customer_appointments_list.service.js';

export class CustomerController {
  constructor(
    private readonly listService: ListService,
    private readonly createService: CreateService,
    private readonly getService: GetService,
    private readonly updateService: UpdateService,
    private readonly deleteService: DeleteService,
    private readonly checkDuplicateService: CheckDuplicateService,
    private readonly appointmentsListService: AppointmentsListService,
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = parseQuery(customerListQuerySchema, req.query);
    const result = await this.listService.execute(requireCtx(req), query);
    res.status(200).json({
      data: result.items,
      meta: result.nextCursor ? { nextCursor: result.nextCursor } : undefined,
    });
  }

  async create(req: Request, res: Response): Promise<void> {
    const customerSchema = parseBody(customerCreateSchema, req.body);
    const customer = await this.createService.execute(
      requireCtx(req),
      customerSchema,
      requestMeta(req),
    );
    res.status(201).json({ data: customer });
  }

  async get(req: Request, res: Response): Promise<void> {
    const customerId = req.params.id;
    if (!customerId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const customer = await this.getService.execute(requireCtx(req), customerId);
    res.status(200).json({ data: customer });
  }

  async update(req: Request, res: Response): Promise<void> {
    const customerId = req.params.id;
    if (!customerId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const customerSchema = parseBody(customerUpdateSchema, req.body);
    const customer = await this.updateService.execute(
      requireCtx(req),
      customerId,
      customerSchema,
      requestMeta(req),
    );
    res.status(200).json({ data: customer });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const customerId = req.params.id;
    if (!customerId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    await this.deleteService.execute(requireCtx(req), customerId, requestMeta(req));
    res.status(204).send();
  }

  async checkDuplicate(req: Request, res: Response): Promise<void> {
    const query = parseQuery(customerDuplicateQuerySchema, req.query);
    const result = await this.checkDuplicateService.execute(requireCtx(req), query);
    res.status(200).json({ data: result });
  }

  async listAppointments(req: Request, res: Response): Promise<void> {
    const customerId = req.params.id;
    if (!customerId) throw new AppError('VALIDATION_ERROR', 'id obrigatório.', 400);
    const result = await this.appointmentsListService.execute(requireCtx(req), customerId);
    res.status(200).json({ data: result });
  }
}
