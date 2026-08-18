import { z } from 'zod';

export const authLoginSchema = z.object({
  email: z.string().email('E-mail inválido.').max(254),
  password: z.string().min(1, 'Informe a senha.'),
});

export const authSignupSchema = z.object({
  email: z.string().email('E-mail inválido.').max(254),
  password: z.string().min(10, 'Senha deve ter no mínimo 10 caracteres.').max(128),
  tenantName: z.string().min(2, 'Informe o nome da barbearia.').max(80),
  phone: z.string().min(8, 'Informe o telefone.').max(20),
});

export const authForgotSchema = z.object({
  email: z.string().email('E-mail inválido.').max(254),
});

export const authResetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(10, 'Senha deve ter no mínimo 10 caracteres.').max(128),
});

export const authAcceptInviteSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(10, 'Senha deve ter no mínimo 10 caracteres.').max(128),
  name: z.string().min(2, 'Informe seu nome.').max(80),
});
