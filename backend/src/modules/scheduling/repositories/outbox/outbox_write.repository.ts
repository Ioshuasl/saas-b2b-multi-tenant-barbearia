import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { AppointmentOutboxPayload } from '../../models/events/appointment_outbox.events.js';

export async function writeAppointmentOutboxTx(
  tx: Prisma.TransactionClient,
  ctx: RequestContext,
  name: string,
  payload: AppointmentOutboxPayload,
): Promise<void> {
  await tx.outboxEvent.create({
    data: {
      id: idGenerator.next(),
      tenantId: ctx.tenantId,
      name,
      payload,
    },
  });
}
