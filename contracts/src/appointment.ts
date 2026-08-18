import { z } from 'zod';

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  IN_SERVICE: 'IN_SERVICE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export type AppointmentStatusName = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const APPOINTMENT_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.IN_SERVICE,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
] as const;

export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES);

export const AppointmentSource = {
  PUBLIC_PAGE: 'PUBLIC_PAGE',
  PANEL: 'PANEL',
  PHONE: 'PHONE',
  WALKIN: 'WALKIN',
} as const;

export type AppointmentSourceName = (typeof AppointmentSource)[keyof typeof AppointmentSource];

export const APPOINTMENT_SOURCES = [
  AppointmentSource.PUBLIC_PAGE,
  AppointmentSource.PANEL,
  AppointmentSource.PHONE,
  AppointmentSource.WALKIN,
] as const;

export const appointmentSourceSchema = z.enum(APPOINTMENT_SOURCES);

export const AppointmentHistoryAction = {
  CREATED: 'CREATED',
  RESCHEDULED: 'RESCHEDULED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  CANCELLED: 'CANCELLED',
} as const;

export type AppointmentHistoryActionName =
  (typeof AppointmentHistoryAction)[keyof typeof AppointmentHistoryAction];

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

export type AppointmentListQuery = {
  from?: string;
  to?: string;
  staffId?: string;
  status?: AppointmentStatusName;
  locationId?: string;
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

export const appointmentCreateSchema = z.object({
  customerId: z.string().uuid(),
  staffId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()).min(1),
  startsAt: z.string().datetime({ offset: true }),
  source: appointmentSourceSchema,
  notes: z.string().max(2000).optional(),
  notifyCustomer: z.boolean().optional(),
});

export type AppointmentCreateBody = z.infer<typeof appointmentCreateSchema>;

export const appointmentUpdateSchema = z
  .object({
    startsAt: z.string().datetime({ offset: true }).optional(),
    staffId: z.string().uuid().optional(),
    serviceIds: z.array(z.string().uuid()).min(1).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  });

export type AppointmentUpdateBody = z.infer<typeof appointmentUpdateSchema>;

export const appointmentStatusBodySchema = z
  .object({
    status: appointmentStatusSchema,
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

export type AppointmentStatusBody = z.infer<typeof appointmentStatusBodySchema>;

export const appointmentCancelSchema = z.object({
  reason: z.string().min(2).max(500),
});

export type AppointmentCancelBody = z.infer<typeof appointmentCancelSchema>;

export const appointmentListQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  staffId: z.string().uuid().optional(),
  status: appointmentStatusSchema.optional(),
  locationId: z.string().uuid().optional(),
});
