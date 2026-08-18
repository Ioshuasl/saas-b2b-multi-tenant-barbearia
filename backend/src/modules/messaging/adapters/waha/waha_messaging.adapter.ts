import { env } from '../../../../shared/config/env.js';
import { logger } from '../../../../shared/config/logger.js';
import { AppError } from '../../../../shared/domain/errors.js';
import { MessagingSessionStatus } from '../../enum/account/messaging_session_status.enum.js';
import type { MessagingProvider } from '../../types/ports/messaging_provider.port.js';
import type {
  MessagingSendInput,
  MessagingSendResult,
  MessagingSessionSnapshot,
} from '../../types/messaging.types.js';
import { mapWahaSessionStatus } from '../../helpers/waha_webhook.js';

type WahaSessionResponse = {
  name?: string;
  status?: string;
  me?: { id?: string; pushName?: string };
  config?: unknown;
};

type WahaQrResponse = {
  mimetype?: string;
  data?: string;
  pairingCode?: string;
};

export class WahaMessagingAdapter implements MessagingProvider {
  private baseUrl(): string {
    if (!env.WAHA_BASE_URL) {
      throw new AppError('MESSAGING_UNAVAILABLE', 'WAHA_BASE_URL não configurado.', 503);
    }
    return env.WAHA_BASE_URL.replace(/\/$/, '');
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (env.WAHA_API_KEY) {
      headers['X-Api-Key'] = env.WAHA_API_KEY;
    }
    return headers;
  }

  private webhookUrl(): string {
    if (env.WAHA_WEBHOOK_URL) {
      return env.WAHA_WEBHOOK_URL.replace(/\/$/, '');
    }
    return `${env.APP_PUBLIC_URL.replace(/\/$/, '')}/api/v1/webhooks/whatsapp`;
  }

  async startSession(sessionName: string): Promise<MessagingSessionSnapshot> {
    const body = {
      name: sessionName,
      start: true,
      config: {
        webhooks: [
          {
            url: this.webhookUrl(),
            events: ['session.status', 'message.ack'],
            hmac: getWebhookHmacConfig(),
          },
        ],
      },
    };

    const response = await fetch(`${this.baseUrl()}/api/sessions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!response.ok && response.status !== 409) {
      const text = await response.text();
      throw new AppError('MESSAGING_UNAVAILABLE', `WAHA start session: ${text}`, 503);
    }

    return this.getSession(sessionName);
  }

  async getSession(sessionName: string): Promise<MessagingSessionSnapshot> {
    const response = await fetch(`${this.baseUrl()}/api/sessions/${encodeURIComponent(sessionName)}`, {
      headers: this.headers(),
    });

    if (response.status === 404) {
      return { status: MessagingSessionStatus.PENDING };
    }

    if (!response.ok) {
      const text = await response.text();
      throw new AppError('MESSAGING_UNAVAILABLE', `WAHA get session: ${text}`, 503);
    }

    const data = (await response.json()) as WahaSessionResponse;
    const status = mapWahaSessionStatus(data.status ?? 'PENDING') as MessagingSessionSnapshot['status'];
    const phone = data.me?.id?.replace('@c.us', '') ?? null;

    return {
      status,
      displayPhone: phone ? `+${phone}` : null,
    };
  }

  async getQr(sessionName: string): Promise<MessagingSessionSnapshot> {
    const response = await fetch(
      `${this.baseUrl()}/api/${encodeURIComponent(sessionName)}/auth/qr`,
      {
        method: 'GET',
        headers: this.headers(),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new AppError('MESSAGING_UNAVAILABLE', `WAHA get QR: ${text}`, 503);
    }

    const data = (await response.json()) as WahaQrResponse;
    const session = await this.getSession(sessionName);

    return {
      ...session,
      status: MessagingSessionStatus.PENDING,
      qr: data.data ? `data:${data.mimetype ?? 'image/png'};base64,${data.data}` : null,
      pairingCode: data.pairingCode ?? null,
    };
  }

  async logout(sessionName: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl()}/api/sessions/${encodeURIComponent(sessionName)}/logout`,
      {
        method: 'POST',
        headers: this.headers(),
      },
    );

    if (!response.ok && response.status !== 404) {
      const text = await response.text();
      logger.warn({ sessionName, text }, 'waha_logout_failed');
    }
  }

  async sendText(input: MessagingSendInput): Promise<MessagingSendResult> {
    const chatId = `${input.toE164.replace(/\D/g, '')}@c.us`;
    const response = await fetch(`${this.baseUrl()}/api/sendText`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        session: input.sessionName,
        chatId,
        text: input.body,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new AppError('MESSAGING_SEND_FAILED', `WAHA sendText: ${text}`, 502);
    }

    const data = (await response.json()) as { id?: string };
    return { providerMessageId: data.id ?? `waha-${Date.now()}` };
  }
}

function getWebhookHmacConfig(): { key: string } | undefined {
  const key = env.WAHA_WEBHOOK_HMAC_KEY ?? env.WAHA_API_KEY;
  return key ? { key } : undefined;
}
