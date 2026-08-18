import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { sealCustomerNotes } from '../../helpers/notes_crypto.js';
import type { CustomerUpdateSchema } from '../../schemas/customer.schema.js';
import type { RequestMeta } from '../../types/request_meta.types.js';
import type { CustomerDetail } from '../../types/customer/customer.types.js';
import type { GetService } from './customer_get.service.js';
import type { UpdateRepository } from '../../repositories/customer/customer_update.repository.js';

export class UpdateService {
  constructor(
    private readonly getService: GetService,
    private readonly updateRepository: UpdateRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    customerId: string,
    customerSchema: CustomerUpdateSchema,
    requestMeta: RequestMeta,
  ): Promise<CustomerDetail> {
    const current = await this.getService.execute(ctx, customerId);

    let sealedNotes: string | null | undefined;
    let plainNotes: string | null | undefined;

    if (customerSchema.notes !== undefined) {
      plainNotes = customerSchema.notes;
      sealedNotes =
        customerSchema.notes === null
          ? null
          : await sealCustomerNotes(customerSchema.notes ?? undefined);
    } else if (current.notes) {
      plainNotes = current.notes;
    }

    const updated = await this.updateRepository.execute(
      ctx,
      customerId,
      customerSchema,
      sealedNotes,
      plainNotes,
    );
    if (!updated) throw new NotFoundError();

    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: AuditAction.CUSTOMER_UPDATED,
      resourceType: 'customer',
      resourceId: customerId,
      customerId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    if (updated.notes && customerSchema.notes === undefined) {
      updated.notes = plainNotes ?? null;
    } else if (customerSchema.notes !== undefined) {
      updated.notes = plainNotes ?? null;
    }

    return updated;
  }
}
