import { describe, expect, it } from 'vitest';
import { Appointment } from './appointment.model.js';
import { AppointmentStatus } from '../enum/appointment/appointment_status.enum.js';
import { AppointmentSource } from '../enum/appointment/appointment_source.enum.js';
import { InvalidStateTransitionError } from './errors/invalid_state_transition.error.js';

function anAppointment(overrides: Partial<ConstructorParameters<typeof Appointment>[0]> = {}) {
  return new Appointment({
    id: 'appt-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    customerId: 'cust-1',
    staffId: 'staff-1',
    startsAt: new Date('2026-08-20T14:00:00.000Z'),
    endsAt: new Date('2026-08-20T14:40:00.000Z'),
    status: AppointmentStatus.SCHEDULED,
    source: AppointmentSource.PANEL,
    totalPriceCents: 4500n,
    ...overrides,
  });
}

describe('Appointment', () => {
  it('permite SCHEDULED → CONFIRMED → CANCELLED com motivo', () => {
    const scheduled = anAppointment();
    const confirmed = scheduled.withStatus(AppointmentStatus.CONFIRMED, new Date());
    const cancelled = confirmed.withStatus(
      AppointmentStatus.CANCELLED,
      new Date(),
      'cliente desistiu',
    );
    expect(cancelled.status).toBe(AppointmentStatus.CANCELLED);
    expect(cancelled.props.cancelReason).toBe('cliente desistiu');
  });

  it('rejeita COMPLETED a partir de SCHEDULED', () => {
    expect(() =>
      anAppointment().withStatus(AppointmentStatus.COMPLETED, new Date()),
    ).toThrow(InvalidStateTransitionError);
  });

  it('rejeita NO_SHOW antes de startsAt', () => {
    const confirmed = anAppointment({ status: AppointmentStatus.CONFIRMED });
    expect(() =>
      confirmed.withStatus(AppointmentStatus.NO_SHOW, new Date('2026-08-20T13:00:00.000Z')),
    ).toThrow(InvalidStateTransitionError);
  });

  it('rejeita CANCELLED sem motivo', () => {
    expect(() =>
      anAppointment().withStatus(AppointmentStatus.CANCELLED, new Date()),
    ).toThrow(InvalidStateTransitionError);
  });

  it('identifica status terminal', () => {
    expect(anAppointment({ status: AppointmentStatus.COMPLETED }).isTerminal()).toBe(true);
    expect(anAppointment({ status: AppointmentStatus.SCHEDULED }).isTerminal()).toBe(false);
  });

  it('canTransition reflete matriz permitida', () => {
    expect(Appointment.canTransition(AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED)).toBe(
      true,
    );
    expect(Appointment.canTransition(AppointmentStatus.SCHEDULED, AppointmentStatus.COMPLETED)).toBe(
      false,
    );
  });
});
