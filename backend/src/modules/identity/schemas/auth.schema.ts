import { z } from 'zod';

export const authSignupSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(10, 'Senha deve ter no mínimo 10 caracteres.').max(128),
  tenantName: z.string().min(2).max(80).transform((v) => v.trim()),
  phone: z.string().min(8).max(20).transform((v) => v.trim()),
});

export type AuthSignupSchema = z.infer<typeof authSignupSchema>;

export const authLoginSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1).max(128),
});

export type AuthLoginSchema = z.infer<typeof authLoginSchema>;

export const authPasswordForgotSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
});

export type AuthPasswordForgotSchema = z.infer<typeof authPasswordForgotSchema>;

export const authPasswordResetSchema = z.object({
  token: z.string().min(10).max(256),
  password: z.string().min(10, 'Senha deve ter no mínimo 10 caracteres.').max(128),
});

export type AuthPasswordResetSchema = z.infer<typeof authPasswordResetSchema>;

export const authVerifyEmailSchema = z.object({
  token: z.string().min(10).max(256),
});

export type AuthVerifyEmailSchema = z.infer<typeof authVerifyEmailSchema>;
