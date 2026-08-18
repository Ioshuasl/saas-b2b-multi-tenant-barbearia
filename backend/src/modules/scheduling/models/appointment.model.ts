import type { AppointmentSourceName } from '../enum/appointment/appointment_source.enum.js';
import {
  AppointmentStatus,
  TERMINAL_APPOINTMENT_STATUSES,
  type AppointmentStatusName,
} from '../enum/appointment/appointment_status.enum.js';
import { InvalidStateTransitionError } from './errors/invalid_state_transition.error.js';

export type AppointmentProps = {
  id: string;
  tenantId: string;
  locationId: string;
  customerId: string;
  staffId: string;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatusName;
  source: AppointmentSourceName;
  totalPriceCents: bigint;
  notes?: string | null;
  cancelTokenHash?: string | null;
  canceledAt?: Date | null;
  canceledBy?: string | null;
  cancelReason?: string | null;
  createdBy?: string | null;
};

const ALLOWED_TRANSITIONS: Record<AppointmentStatusName, readonly AppointmentStatusName[]> = {
  [AppointmentStatus.SCHEDULED]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.IN_SERVICE,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.IN_SERVICE]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

export class Appointment {
  constructor(readonly props: AppointmentProps) {}

  get status(): AppointmentStatusName {
    return this.props.status;
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  isTerminal(): boolean {
    return TERMINAL_APPOINTMENT_STATUSES.includes(this.props.status);
  }

  assertTransitionTo(next: AppointmentStatusName, now: Date, cancelReason?: string): void {
    if (this.isTerminal()) {
      throw new InvalidStateTransitionError(this.props.status, next);
    }

    const allowed = ALLOWED_TRANSITIONS[this.props.status];
    if (!allowed.includes(next)) {
      throw new InvalidStateTransitionError(this.props.status, next);
    }

    if (next === AppointmentStatus.CANCELLED && (!cancelReason || cancelReason.trim().length === 0)) {
      throw new InvalidStateTransitionError(this.props.status, next);
    }

    if (next === AppointmentStatus.NO_SHOW && now < this.props.startsAt) {
      throw new InvalidStateTransitionError(this.props.status, next);
    }

    if (next === AppointmentStatus.COMPLETED && this.props.status !== AppointmentStatus.IN_SERVICE) {
      throw new InvalidStateTransitionError(this.props.status, next);
    }
  }

  withStatus(next: AppointmentStatusName, now: Date, cancelReason?: string): Appointment {
    this.assertTransitionTo(next, now, cancelReason);
    return new Appointment({
      ...this.props,
      status: next,
      canceledAt: next === AppointmentStatus.CANCELLED ? now : this.props.canceledAt,
      cancelReason: next === AppointmentStatus.CANCELLED ? cancelReason : this.props.cancelReason,
    });
  }

  static canTransition(
    from: AppointmentStatusName,
    to: AppointmentStatusName,
  ): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  }
}
