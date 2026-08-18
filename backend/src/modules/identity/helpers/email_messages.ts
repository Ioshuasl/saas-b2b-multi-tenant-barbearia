import { env } from '../../../shared/config/env.js';

export function inviteAcceptUrl(token: string): string {
  return `${env.APP_PUBLIC_URL}/accept-invite?token=${encodeURIComponent(token)}`;
}

export function resetPasswordUrl(token: string): string {
  return `${env.APP_PUBLIC_URL}/reset-password?token=${encodeURIComponent(token)}`;
}

export function verifyEmailUrl(token: string): string {
  return `${env.APP_PUBLIC_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

export function inviteEmail(input: { tenantName: string; token: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const url = inviteAcceptUrl(input.token);
  return {
    subject: `Convite para ${input.tenantName}`,
    text: `Você foi convidado para a equipe de ${input.tenantName}. Aceite o convite: ${url}`,
    html: `<p>Você foi convidado para a equipe de <strong>${input.tenantName}</strong>.</p><p><a href="${url}">Aceitar convite</a></p>`,
  };
}

export function resetPasswordEmail(token: string): {
  subject: string;
  text: string;
  html: string;
} {
  const url = resetPasswordUrl(token);
  return {
    subject: 'Redefinição de senha',
    text: `Use este link para redefinir sua senha (válido por 1 hora): ${url}`,
    html: `<p>Use este link para redefinir sua senha (válido por 1 hora):</p><p><a href="${url}">Redefinir senha</a></p>`,
  };
}

export function passwordChangedEmail(): { subject: string; text: string; html: string } {
  return {
    subject: 'Sua senha foi alterada',
    text: 'Sua senha foi redefinida. Se não foi você, entre em contato com o suporte.',
    html: '<p>Sua senha foi redefinida. Se não foi você, entre em contato com o suporte.</p>',
  };
}

export function verifyEmailMessage(token: string): {
  subject: string;
  text: string;
  html: string;
} {
  const url = verifyEmailUrl(token);
  return {
    subject: 'Confirme seu e-mail',
    text: `Confirme seu e-mail: ${url}`,
    html: `<p>Confirme seu e-mail:</p><p><a href="${url}">Verificar e-mail</a></p>`,
  };
}
