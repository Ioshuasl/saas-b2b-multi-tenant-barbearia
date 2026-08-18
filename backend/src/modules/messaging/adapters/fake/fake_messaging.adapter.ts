import { logger } from '../../../../shared/config/logger.js';
import type { MessagingProvider } from '../../types/ports/messaging_provider.port.js';
import type {
  MessagingSendInput,
  MessagingSendResult,
  MessagingSessionSnapshot,
} from '../../types/messaging.types.js';
import { MessagingSessionStatus } from '../../enum/account/messaging_session_status.enum.js';

const FAKE_QR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export class FakeMessagingAdapter implements MessagingProvider {
  private readonly connected = new Set<string>();

  async startSession(sessionName: string): Promise<MessagingSessionSnapshot> {
    logger.info({ sessionName }, 'fake_messaging_start_session');
    return {
      status: MessagingSessionStatus.PENDING,
      qr: FAKE_QR,
      pairingCode: null,
    };
  }

  async getSession(sessionName: string): Promise<MessagingSessionSnapshot> {
    if (this.connected.has(sessionName)) {
      return {
        status: MessagingSessionStatus.CONNECTED,
        displayPhone: '+5511999990000',
      };
    }
    return {
      status: MessagingSessionStatus.PENDING,
      qr: FAKE_QR,
    };
  }

  async getQr(sessionName: string): Promise<MessagingSessionSnapshot> {
    this.connected.add(sessionName);
    return this.getSession(sessionName);
  }

  async logout(sessionName: string): Promise<void> {
    this.connected.delete(sessionName);
    logger.info({ sessionName }, 'fake_messaging_logout');
  }

  async sendText(input: MessagingSendInput): Promise<MessagingSendResult> {
    logger.info({ sessionName: input.sessionName, to: input.toE164 }, 'fake_messaging_send');
    return { providerMessageId: `fake-${Date.now()}` };
  }
}
