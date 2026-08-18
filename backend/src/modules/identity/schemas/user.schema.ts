import { z } from 'zod';

export const userRoleSchema = z.enum(['OWNER', 'MANAGER', 'STAFF', 'RECEPTIONIST']);

export const invitationCreateSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
  role: userRoleSchema,
  locationIds: z.array(z.string().uuid()).default([]),
});

export type InvitationCreateSchema = z.infer<typeof invitationCreateSchema>;

export const invitationAcceptSchema = z.object({
  token: z.string().min(10).max(256),
  password: z.string().min(10, 'Senha deve ter no mínimo 10 caracteres.').max(128),
  name: z.string().min(2).max(80).transform((v) => v.trim()),
});

export type InvitationAcceptSchema = z.infer<typeof invitationAcceptSchema>;

export const userUpdateSchema = z
  .object({
    role: userRoleSchema.optional(),
    locationIds: z.array(z.string().uuid()).optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.role !== undefined || value.locationIds !== undefined || value.active !== undefined,
    { message: 'Informe ao menos um campo.' },
  );

export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;
