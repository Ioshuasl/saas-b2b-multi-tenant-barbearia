import { z } from 'zod';
import { APPOINTMENT_SOURCES } from '@/packages/operacional/enum/Appointment/AppointmentSourceEnum';
import { APPOINTMENT_STATUSES } from '@/packages/operacional/enum/Appointment/AppointmentStatusEnum';

export const appointmentSchema = z.object({
  customerId: z.string().uuid('Selecione o cliente.'),
  staffId: z.string().uuid('Selecione o profissional.'),
  serviceIds: z.array(z.string().uuid()).min(1, 'Selecione ao menos um serviço.'),
  startsAt: z.string({ required_error: 'Informe o horário.' }).datetime({ offset: true }),
  source: z.enum(APPOINTMENT_SOURCES),
  notes: z.string().max(2000).optional(),
  notifyCustomer: z.boolean().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export const appointmentStatusFormSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
  reason: z.string().min(2).max(500).optional(),
});
