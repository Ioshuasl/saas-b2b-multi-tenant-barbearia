/**
 * Atualiza webhook da sessão WAHA (PUT /api/sessions/{name}).
 * Uso: tsx scripts/setup-waha-webhook.ts [sessionName]
 * Requer WAHA_BASE_URL, WAHA_API_KEY e WAHA_WEBHOOK_URL no .env
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

const sessionName = process.argv[2] ?? 'ioshua';
const baseUrl = process.env.WAHA_BASE_URL?.replace(/\/$/, '');
const apiKey = process.env.WAHA_API_KEY;
const webhookUrl = process.env.WAHA_WEBHOOK_URL;
const hmacKey = process.env.WAHA_WEBHOOK_HMAC_KEY ?? apiKey;

if (!baseUrl || !apiKey || !webhookUrl) {
  console.error('Defina WAHA_BASE_URL, WAHA_API_KEY e WAHA_WEBHOOK_URL no .env');
  process.exit(1);
}

const body = {
  name: sessionName,
  config: {
    webhooks: [
      {
        url: webhookUrl,
        events: ['session.status', 'message.ack'],
        hmac: hmacKey ? { key: hmacKey } : undefined,
      },
    ],
  },
};

const res = await fetch(`${baseUrl}/api/sessions/${encodeURIComponent(sessionName)}`, {
  method: 'PUT',
  headers: {
    'content-type': 'application/json',
    'X-Api-Key': apiKey,
  },
  body: JSON.stringify(body),
});

const text = await res.text();
if (!res.ok) {
  console.error(`WAHA PUT falhou (${res.status}):`, text);
  process.exit(1);
}

console.log(`Webhook atualizado para ${webhookUrl} (sessão ${sessionName})`);
console.log(text);
