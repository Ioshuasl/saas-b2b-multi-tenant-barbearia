import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { SEED } from '../prisma/seeders/constants.js';
import { getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { idGenerator } from '../src/shared/helpers/id_generator.js';
import { Appointment } from '../src/modules/scheduling/models/appointment.model.js';
import {
  AppointmentStatus,
} from '../src/modules/scheduling/enum/appointment/appointment_status.enum.js';
import { InvalidStateTransitionError } from '../src/modules/scheduling/models/errors/invalid_state_transition.error.js';
import { SlotTakenError } from '../src/modules/scheduling/models/errors/slot_taken.error.js';
import { AppointmentSource } from '../src/modules/scheduling/enum/appointment/appointment_source.enum.js';
import { persistService, slotCalculate } from '../src/modules/scheduling/scheduling.module.js';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

function fail(message: string, extra?: unknown): never {
  console.error('FAIL:', message, extra ?? '');
  throw new Error(message);
}

function ctxOf(tenantId: string, userId: string) {
  return {
    tenantId,
    userId,
    requestId: 'check-scheduling-domain',
    role: 'OWNER',
    locationScope: 'ALL' as const,
    locationIds: [] as string[],
  };
}

function assertStateMachine(): void {
  const base = {
    id: 'x',
    tenantId: 't',
    locationId: 'l',
    customerId: 'c',
    staffId: 's',
    startsAt: new Date('2026-08-20T14:00:00.000Z'),
    endsAt: new Date('2026-08-20T14:40:00.000Z'),
    source: AppointmentSource.PANEL,
    totalPriceCents: 0n,
  };

  const scheduled = new Appointment({ ...base, status: AppointmentStatus.SCHEDULED });
  const confirmed = scheduled.withStatus(AppointmentStatus.CONFIRMED, new Date());
  confirmed.withStatus(AppointmentStatus.CANCELLED, new Date(), 'cliente desistiu');

  try {
    new Appointment({ ...base, status: AppointmentStatus.SCHEDULED }).withStatus(
      AppointmentStatus.COMPLETED,
      new Date(),
    );
    fail('COMPLETED a partir de SCHEDULED deveria falhar');
  } catch (err) {
    if (!(err instanceof InvalidStateTransitionError)) fail('erro inesperado na transição', err);
  }

  const confirmedForNoShow = new Appointment({ ...base, status: AppointmentStatus.CONFIRMED });
  try {
    confirmedForNoShow.withStatus(AppointmentStatus.NO_SHOW, new Date('2026-08-20T13:00:00.000Z'));
    fail('NO_SHOW antes de startsAt deveria falhar');
  } catch (err) {
    if (!(err instanceof InvalidStateTransitionError)) fail('erro inesperado NO_SHOW antecipado', err);
  }

  try {
    new Appointment({ ...base, status: AppointmentStatus.SCHEDULED }).withStatus(
      AppointmentStatus.CANCELLED,
      new Date(),
    );
    fail('CANCELLED sem motivo deveria falhar');
  } catch (err) {
    if (!(err instanceof InvalidStateTransitionError)) fail('erro inesperado cancel sem motivo', err);
  }
}

async function main(): Promise<void> {
  assertStateMachine();

  const db = getTenantPrisma();
  const ctx = ctxOf(SEED.tenantA.id, SEED.userAOwner.id);

  const service = await db.runInTenantContext(ctx, (tx) =>
    tx.service.findFirst({ where: { tenantId: SEED.tenantA.id, deletedAt: null } }),
  );
  let serviceId = service?.id;
  if (!serviceId) {
    serviceId = idGenerator.next();
    await db.runInTenantContext(ctx, async (tx) => {
      await tx.service.create({
        data: {
          id: serviceId,
          tenantId: SEED.tenantA.id,
          name: 'Corte Domain',
          durationMinutes: 40,
          priceCents: 4500n,
        },
      });
    });
  }

  const staffId = idGenerator.next();
  await db.runInTenantContext(ctx, async (tx) => {
    await tx.staff.create({
      data: {
        id: staffId,
        tenantId: SEED.tenantA.id,
        homeLocationId: SEED.locationA.id,
        name: 'Barbeiro Domain Check',
      },
    });
    await tx.staffLocation.create({
      data: {
        tenantId: SEED.tenantA.id,
        staffId,
        locationId: SEED.locationA.id,
      },
    });
  });

  const customerId = idGenerator.next();
  await db.runInTenantContext(ctx, async (tx) => {
    await tx.customer.create({
      data: {
        id: customerId,
        tenantId: SEED.tenantA.id,
        firstLocationId: SEED.locationA.id,
        name: 'Cliente Domain',
        phone: `+5562${randomUUID().replace(/\D/g, '').slice(0, 9)}`,
      },
    });
  });

  const startsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  startsAt.setUTCMinutes(0, 0, 0);

  const slot = await slotCalculate.execute(ctx, {
    locationId: SEED.locationA.id,
    serviceIds: [serviceId],
    startsAt,
  });
  const expectedDuration = service?.durationMinutes ?? 40;
  if (slot.totalDurationMinutes !== expectedDuration) {
    fail('duração calculada deveria bater com snapshot', slot);
  }

  const first = await persistService.execute(ctx, {
    locationId: SEED.locationA.id,
    customerId,
    staffId,
    startsAt,
    serviceIds: [serviceId],
    source: AppointmentSource.PANEL,
  });

  let overlapFailed = false;
  try {
    await persistService.execute(ctx, {
      locationId: SEED.locationA.id,
      customerId,
      staffId,
      startsAt,
      serviceIds: [serviceId],
      source: AppointmentSource.PANEL,
    });
  } catch (err) {
    if (err instanceof SlotTakenError) overlapFailed = true;
    else throw err;
  }
  if (!overlapFailed) fail('segundo insert sobreposto deveria lançar SlotTakenError');

  const historyCount = await db.runInTenantContext(ctx, (tx) =>
    tx.appointmentHistory.count({ where: { appointmentId: first.id } }),
  );
  if (historyCount !== 1) fail('histórico CREATED deveria ter 1 linha', historyCount);

  console.log('OK: scheduling domain (state machine + EXCLUDE + snapshots)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
