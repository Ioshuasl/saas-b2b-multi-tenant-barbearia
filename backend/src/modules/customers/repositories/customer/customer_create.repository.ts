import { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { DuplicatePhoneError } from '../../models/errors/duplicate_phone.error.js';
import type { CustomerOriginName } from '../../enum/customer/customer_origin.enum.js';
import type { CustomerDetail } from '../../types/customer/customer.types.js';
import { toCustomerDetail } from './mappers/customer.mapper.js';

export type CustomerCreatePersist = {
  firstLocationId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  birthdate?: string;
  marketingOptIn?: boolean;
  origin: CustomerOriginName;
};

export class CreateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    persist: CustomerCreatePersist,
    sealedNotes: string | undefined,
  ): Promise<CustomerDetail> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      try {
        return await this.executeTx(tx, ctx, persist, sealedNotes);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new DuplicatePhoneError();
        }
        throw err;
      }
    });
  }

  async executeTx(
    tx: Prisma.TransactionClient,
    ctx: RequestContext,
    persist: CustomerCreatePersist,
    sealedNotes: string | undefined,
  ): Promise<CustomerDetail> {
    const created = await tx.customer.create({
      data: {
        id: idGenerator.next(),
        tenantId: ctx.tenantId,
        firstLocationId: persist.firstLocationId,
        name: persist.name,
        phone: persist.phone,
        email: persist.email,
        notes: sealedNotes,
        birthdate: persist.birthdate ? new Date(`${persist.birthdate}T00:00:00.000Z`) : undefined,
        marketingOptIn: persist.marketingOptIn ?? false,
        origin: persist.origin,
      },
    });
    return toCustomerDetail(created, persist.notes ?? null);
  }
}
