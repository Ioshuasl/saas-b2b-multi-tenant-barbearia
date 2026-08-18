import { NotFoundError } from '../../../../shared/domain/errors.js';
import { getSummary } from '../../../customers/customers_public.js';
import { verifyCancelToken } from '../../helpers/cancel_token.js';
import { maskPhone } from '../../helpers/mask_phone.js';
import { InvalidCancelTokenError } from '../../models/errors/consent_required.error.js';
import type { GetRepository } from '../../repositories/appointment/appointment_get.repository.js';
import type { GetByTokenRepository } from '../../repositories/appointment/appointment_get_by_token.repository.js';
import type { PublicAppointmentMasked } from '../../types/public/public_booking.types.js';
import type { ScopeService } from './public_scope.service.js';

export class AppointmentGetService {
  constructor(
    private readonly scope: ScopeService,
    private readonly getByToken: GetByTokenRepository,
    private readonly getRepository: GetRepository,
  ) {}

  async execute(
    tenantSlug: string,
    locationSlug: string,
    appointmentId: string,
    token: string,
    requestId: string,
  ): Promise<PublicAppointmentMasked> {
    const { scope, ctx } = await this.scope.resolveLocation(tenantSlug, locationSlug, requestId);
    const row = await this.getByToken.execute(ctx, appointmentId, scope.locationId);
    if (!row || !verifyCancelToken(token, row.cancelTokenHash)) {
      throw new InvalidCancelTokenError();
    }

    const detail = await this.getRepository.execute(ctx, appointmentId);
    if (!detail) throw new NotFoundError();

    const customer = await getSummary(ctx, detail.customerId);
    if (!customer) throw new NotFoundError();

    return {
      id: detail.id,
      status: detail.status,
      startsAt: detail.startsAt,
      endsAt: detail.endsAt,
      customer: {
        name: customer.name,
        phoneMasked: maskPhone(customer.phone),
      },
      staff: { id: detail.staffId, name: detail.staffName },
      services: detail.services.map((line) => ({
        name: line.name,
        durationMinutes: line.durationMinutes,
        priceCents: line.priceCents,
      })),
      totalPriceCents: detail.totalPriceCents,
    };
  }
}
