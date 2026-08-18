import type {
  MessagingSendInput,
  MessagingSendResult,
  MessagingSessionSnapshot,
} from '../messaging.types.js';

export type MessagingProvider = {
  startSession(sessionName: string): Promise<MessagingSessionSnapshot>;
  getSession(sessionName: string): Promise<MessagingSessionSnapshot>;
  getQr(sessionName: string): Promise<MessagingSessionSnapshot>;
  logout(sessionName: string): Promise<void>;
  sendText(input: MessagingSendInput): Promise<MessagingSendResult>;
};
