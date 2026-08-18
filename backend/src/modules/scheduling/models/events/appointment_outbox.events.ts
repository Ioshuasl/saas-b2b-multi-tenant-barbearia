export const APPOINTMENT_SCHEDULED_EVENT = 'scheduling.appointment_scheduled';
export const APPOINTMENT_RESCHEDULED_EVENT = 'scheduling.appointment_rescheduled';
export const APPOINTMENT_CANCELLED_EVENT = 'scheduling.appointment_cancelled';
export const APPOINTMENT_COMPLETED_EVENT = 'scheduling.appointment_completed';
export const APPOINTMENT_NO_SHOW_EVENT = 'scheduling.appointment_no_show';

export type AppointmentOutboxPayload = {
  appointmentId: string;
  tenantId: string;
  locationId: string;
  customerId: string;
  staffId: string;
  startsAt: string;
  endsAt: string;
  status: string;
  notifyCustomer?: boolean;
  cancelLink?: string;
  cancelToken?: string;
};
