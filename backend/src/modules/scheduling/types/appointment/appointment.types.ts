import type { AppointmentSourceName } from '../../enum/appointment/appointment_source.enum.js';
import type { AppointmentStatusName } from '../../enum/appointment/appointment_status.enum.js';

export type ServiceSnapshotLine = {
  serviceId: string;
  priceCents: bigint;
  durationMinutes: number;
};

export type CalculatedAppointmentSlot = {
  startsAt: Date;
  endsAt: Date;
  totalPriceCents: bigint;
  totalDurationMinutes: number;
  serviceLines: ServiceSnapshotLine[];
};

export type AppointmentPersistInput = {
  locationId: string;
  customerId: string;
  staffId: string;
  startsAt: Date;
  endsAt: Date;
  totalPriceCents: bigint;
  source: AppointmentSourceName;
  status?: AppointmentStatusName;
  notes?: string;
  cancelTokenHash?: string;
  createdBy?: string;
  serviceLines: ServiceSnapshotLine[];
};

export type AppointmentRecord = {
  id: string;
  tenantId: string;
  locationId: string;
  customerId: string;
  staffId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatusName;
  source: AppointmentSourceName;
  totalPriceCents: number;
  notes: string | null;
};

export type AppointmentServiceLine = {
  serviceId: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
};

export type AppointmentSummary = {
  id: string;
  locationId: string;
  customerId: string;
  customerName: string;
  staffId: string;
  staffName: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatusName;
  source: AppointmentSourceName;
  totalPriceCents: number;
  services: AppointmentServiceLine[];
};

export type AppointmentDetail = AppointmentSummary & {
  notes: string | null;
};

export type AppointmentHistoryItem = {
  id: string;
  action: string;
  fromValue: Record<string, unknown> | null;
  toValue: Record<string, unknown> | null;
  actorId: string | null;
  actorType: string;
  createdAt: string;
};

export type AppointmentListFilters = {
  from?: string;
  to?: string;
  staffId?: string;
  status?: AppointmentStatusName;
  locationId?: string;
};
