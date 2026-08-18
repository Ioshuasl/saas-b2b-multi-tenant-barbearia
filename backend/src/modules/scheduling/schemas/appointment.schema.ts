import { z } from 'zod';
import { APPOINTMENT_SOURCES } from '../enum/appointment/appointment_source.enum.js';
import { AppointmentStatus } from '../enum/appointment/appointment_status.enum.js';

const statusValues = Object.values(AppointmentStatus) as [string, ...string[]];
const sourceValues = APPOINTMENT_SOURCES as [string, ...string[]];

export const appointmentCreateSchema = z.object({
  customerId: z.string().uuid(),
  staffId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()).min(1),
  startsAt: z.string().datetime(),
  source: z.enum(sourceValues),
  notes: z.string().max(2000).optional(),
  notifyCustomer: z.boolean().optional(),
});

export type AppointmentCreateSchema = z.infer<typeof appointmentCreateSchema>;

export const appointmentListQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  staffId: z.string().uuid().optional(),
  status: z.enum(statusValues).optional(),
  locationId: z.string().uuid().optional(),
});

export type AppointmentListQuerySchema = z.infer<typeof appointmentListQuerySchema>;

export const appointmentUpdateSchema = z
  .object({
    startsAt: z.string().datetime().optional(),
    staffId: z.string().uuid().optional(),
    serviceIds: z.array(z.string().uuid()).min(1).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

export type AppointmentUpdateSchema = z.infer<typeof appointmentUpdateSchema>;

export const appointmentStatusSchema = z
  .object({
    status: z.enum(statusValues),
    reason: z.string().min(2).max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === AppointmentStatus.CANCELLED && !value.reason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Motivo obrigatório para cancelamento.',
        path: ['reason'],
      });
    }
  });

export type AppointmentStatusSchema = z.infer<typeof appointmentStatusSchema>;

export const appointmentCancelSchema = z.object({
  reason: z.string().min(2).max(500),
});

export type AppointmentCancelSchema = z.infer<typeof appointmentCancelSchema>;
