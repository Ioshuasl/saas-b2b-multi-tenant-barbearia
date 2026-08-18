import { ApiClientError } from '@/shared/api/api-client';

const API_ERROR_MESSAGES: Record<string, string> = {
  SLOT_TAKEN: 'Este horário acabou de ser reservado.',
  DUPLICATE_RESOURCE: 'Já existe um cadastro com estes dados.',
  INVALID_STATE_TRANSITION: 'Essa mudança de status não é permitida.',
  IDEMPOTENCY_KEY_REUSED: 'Esta operação já foi enviada com dados diferentes. Tente de novo.',
  LEAD_TIME_VIOLATION: 'Horário fora do prazo mínimo de antecedência da unidade.',
  HORIZON_EXCEEDED: 'Horário além do horizonte de agendamento da unidade.',
  BUSINESS_RULE_VIOLATION: 'Este horário não atende as regras da unidade.',
  OUTSIDE_BUSINESS_HOURS: 'Horário fora da jornada da unidade ou do profissional.',
  TOO_LATE_TO_CANCEL: 'Prazo para cancelamento expirado.',
  CONSENT_REQUIRED: 'Consentimento para tratamento de dados é obrigatório.',
  MAX_FUTURE_BOOKINGS: 'Limite de 3 agendamentos futuros por telefone atingido.',
  CAPTCHA_REQUIRED: 'Confirme o captcha para continuar.',
  INVALID_CANCEL_TOKEN: 'Link de cancelamento inválido ou expirado.',
  VALIDATION_ERROR: 'Revise os dados e tente de novo.',
  UNAUTHENTICATED: 'Sessão expirada. Entre de novo.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Registro não encontrado.',
  RISK_NOT_ACCEPTED: 'Confirme a ciência de risco antes de conectar.',
  SUBSCRIPTION_REQUIRED: 'Assinatura necessária para esta ação.',
  PLAN_LIMIT_EXCEEDED: 'Limite do plano atingido.',
  RATE_LIMITED: 'Muitas tentativas. Aguarde um momento.',
  NETWORK_ERROR: 'Não foi possível conectar à API.',
  INTERNAL_ERROR: 'Não foi possível concluir. Tente de novo.',
  PROVIDER_UNAVAILABLE: 'Serviço temporariamente indisponível. Tente de novo.',
};

export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    return API_ERROR_MESSAGES[err.code] ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Não foi possível concluir. Tente de novo.';
}
