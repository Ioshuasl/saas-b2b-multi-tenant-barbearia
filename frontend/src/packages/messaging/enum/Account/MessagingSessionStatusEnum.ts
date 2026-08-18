import type { MessagingSessionStatusName } from '@repo/contracts';

export {
  MESSAGING_SESSION_STATUSES,
  MessagingSessionStatus,
  type MessagingSessionStatusName,
} from '@repo/contracts';

export const MESSAGING_SESSION_STATUS_LABELS: Record<MessagingSessionStatusName, string> = {
  PENDING: 'Aguardando conexão',
  CONNECTED: 'Conectado',
  ERROR: 'Erro na sessão',
  DISCONNECTED: 'Desconectado',
};
