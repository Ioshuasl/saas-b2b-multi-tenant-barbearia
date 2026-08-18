import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { AppointmentHistoryActionName } from '../../enum/appointment/appointment_history_action.enum.js';
import type { HistoryActorTypeName } from '../../enum/appointment/history_actor_type.enum.js';

export type HistoryAppendInput = {
  appointmentId: string;
  action: AppointmentHistoryActionName;
  fromValue?: Record<string, unknown>;
  toValue?: Record<string, unknown>;
  actorId?: string;
  actorType: HistoryActorTypeName;
};

export class AppendRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, input: HistoryAppendInput): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      await this.executeTx(tx, ctx, input);
    });
  }

  async executeTx(
    tx: Prisma.TransactionClient,
    ctx: RequestContext,
    input: HistoryAppendInput,
  ): Promise<void> {
    await tx.appointmentHistory.create({
      data: {
        id: idGenerator.next(),
        tenantId: ctx.tenantId,
        appointmentId: input.appointmentId,
        action: input.action,
        fromValue: input.fromValue as Prisma.InputJsonValue | undefined,
        toValue: input.toValue as Prisma.InputJsonValue | undefined,
        actorId: input.actorId,
        actorType: input.actorType,
      },
    });
  }
}
