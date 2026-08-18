import type { Request, Response } from 'express';
import { AppError } from '../../../shared/domain/errors.js';
import { parseBody, parseQuery } from '../helpers/http_parse.js';
import {
  publicBookSchema as publicBookBodySchema,
  publicCancelSchema as publicCancelBodySchema,
  publicRescheduleSchema as publicRescheduleBodySchema,
  publicTokenQuerySchema,
} from '../schemas/public_booking.schema.js';
import { publicAvailabilityQuerySchema } from '../schemas/public_availability.schema.js';
import type { TenantListService } from '../services/public/public_tenant_list.service.js';
import type { LocationGetService } from '../services/public/public_location_get.service.js';
import type { ListService as AvailabilityListService } from '../services/availability/availability_list.service.js';
import type { BookService } from '../services/public/public_book.service.js';
import type { AppointmentGetService } from '../services/public/public_appointment_get.service.js';
import type { AppointmentUpdateService } from '../services/public/public_appointment_update.service.js';
import type { AppointmentCancelService } from '../services/public/public_appointment_cancel.service.js';
import type { ScopeService } from '../services/public/public_scope.service.js';

export class PublicBookingController {
  constructor(
    private readonly scope: ScopeService,
    private readonly tenantList: TenantListService,
    private readonly locationGet: LocationGetService,
    private readonly availabilityList: AvailabilityListService,
    private readonly bookService: BookService,
    private readonly appointmentGet: AppointmentGetService,
    private readonly appointmentUpdate: AppointmentUpdateService,
    private readonly appointmentCancel: AppointmentCancelService,
  ) {}

  async tenant(req: Request, res: Response): Promise<void> {
    const tenantSlug = req.params.tenantSlug;
    if (!tenantSlug) throw new AppError('VALIDATION_ERROR', 'tenantSlug obrigatório.', 400);
    const data = await this.tenantList.execute(tenantSlug, req.requestId);
    res.status(200).json({ data });
  }

  async location(req: Request, res: Response): Promise<void> {
    const tenantSlug = req.params.tenantSlug;
    const locationSlug = req.params.locationSlug;
    if (!tenantSlug || !locationSlug) {
      throw new AppError('VALIDATION_ERROR', 'tenantSlug e locationSlug obrigatórios.', 400);
    }
    const data = await this.locationGet.execute(tenantSlug, locationSlug, req.requestId);
    res.status(200).json({ data });
  }

  async availability(req: Request, res: Response): Promise<void> {
    const tenantSlug = req.params.tenantSlug;
    const locationSlug = req.params.locationSlug;
    if (!tenantSlug || !locationSlug) {
      throw new AppError('VALIDATION_ERROR', 'tenantSlug e locationSlug obrigatórios.', 400);
    }
    const query = parseQuery(publicAvailabilityQuerySchema, req.query);
    const { ctx } = await this.scope.resolveLocation(tenantSlug, locationSlug, req.requestId);
    const result = await this.availabilityList.execute(ctx, {
      locationId: ctx.locationId!,
      serviceIds: query.serviceIds,
      staffId: query.staffId,
      from: query.from,
      to: query.to,
    });
    res.status(200).json({ data: result });
  }

  async book(req: Request, res: Response): Promise<void> {
    const tenantSlug = req.params.tenantSlug;
    const locationSlug = req.params.locationSlug;
    if (!tenantSlug || !locationSlug) {
      throw new AppError('VALIDATION_ERROR', 'tenantSlug e locationSlug obrigatórios.', 400);
    }
    const bookBody = parseBody(publicBookBodySchema, req.body);
    const idempotencyKey = req.header('idempotency-key') ?? req.header('Idempotency-Key') ?? '';
    const data = await this.bookService.execute(req, tenantSlug, locationSlug, bookBody, idempotencyKey);
    res.status(201).json({ data });
  }

  async getAppointment(req: Request, res: Response): Promise<void> {
    const tenantSlug = req.params.tenantSlug;
    const locationSlug = req.params.locationSlug;
    const appointmentId = req.params.id;
    if (!tenantSlug || !locationSlug || !appointmentId) {
      throw new AppError('VALIDATION_ERROR', 'Parâmetros obrigatórios ausentes.', 400);
    }
    const query = parseQuery(publicTokenQuerySchema, req.query);
    const data = await this.appointmentGet.execute(
      tenantSlug,
      locationSlug,
      appointmentId,
      query.token,
      req.requestId,
    );
    res.status(200).json({ data });
  }

  async updateAppointment(req: Request, res: Response): Promise<void> {
    const tenantSlug = req.params.tenantSlug;
    const locationSlug = req.params.locationSlug;
    const appointmentId = req.params.id;
    if (!tenantSlug || !locationSlug || !appointmentId) {
      throw new AppError('VALIDATION_ERROR', 'Parâmetros obrigatórios ausentes.', 400);
    }
    const query = parseQuery(publicTokenQuerySchema, req.query);
    const rescheduleBody = parseBody(publicRescheduleBodySchema, req.body);
    const data = await this.appointmentUpdate.execute(
      tenantSlug,
      locationSlug,
      appointmentId,
      query.token,
      rescheduleBody,
      req.requestId,
    );
    res.status(200).json({ data });
  }

  async cancelAppointment(req: Request, res: Response): Promise<void> {
    const tenantSlug = req.params.tenantSlug;
    const locationSlug = req.params.locationSlug;
    const appointmentId = req.params.id;
    if (!tenantSlug || !locationSlug || !appointmentId) {
      throw new AppError('VALIDATION_ERROR', 'Parâmetros obrigatórios ausentes.', 400);
    }
    const query = parseQuery(publicTokenQuerySchema, req.query);
    const cancelBody = parseBody(publicCancelBodySchema, req.body ?? {});
    await this.appointmentCancel.execute(
      tenantSlug,
      locationSlug,
      appointmentId,
      query.token,
      cancelBody,
      req.requestId,
    );
    res.status(204).send();
  }
}
