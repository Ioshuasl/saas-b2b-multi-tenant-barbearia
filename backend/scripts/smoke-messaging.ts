import { config } from 'dotenv';
import { createHmac, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/shared/auth/jwt.js';
import { env } from '../src/shared/config/env.js';
import { getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { idGenerator } from '../src/shared/helpers/id_generator.js';
import { startWorkers } from '../src/worker/bootstrap.js';
import { getMessagingQueue } from '../src/shared/queue/queues.js';
import { MessageTemplateKey } from '../src/modules/messaging/enum/account/messaging_session_status.enum.js';
import { reminderJobId } from '../src/shared/queue/job_types.js';
import { SEED } from '../prisma/seeders/constants.js';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

type Json = Record<string, unknown>;

async function request(
  port: number,
  path: string,
  init: {
    method?: string;
    body?: unknown;
    token?: string;
    headers?: Record<string, string>;
    rawBody?: Buffer;
  } = {},
): Promise<{ status: number; body: Json; text: string }> {
  const headers: Record<string, string> = { ...(init.headers ?? {}) };
  if (init.rawBody || init.body !== undefined) headers['content-type'] = 'application/json';
  if (init.token) headers.authorization = `Bearer ${init.token}`;

  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.rawBody ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
  });
  const text = await res.text();
  return { status: res.status, body: (text ? JSON.parse(text) : {}) as Json, text };
}

function fail(message: string, extra?: unknown): never {
  console.error('FAIL:', message, extra ?? '');
  throw new Error(message);
}

function dataOf(body: Json): Json {
  return (body.data ?? body) as Json;
}

async function pickPublicSlot(
  port: number,
  tenantSlug: string,
  locationSlug: string,
  serviceId: string,
): Promise<string> {
  const from = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const availability = await request(
    port,
    `/api/v1/public/${tenantSlug}/${locationSlug}/availability?serviceIds=${serviceId}&from=${from}&to=${from}`,
  );
  if (availability.status !== 200) fail('availability', availability);
  const slots = (dataOf(availability.body).slots ?? []) as Json[];
  if (slots.length === 0) fail('sem slots públicos');
  return slots[0]!.startsAt as string;
}

async function ensureServiceId(tenantId: string, userId: string): Promise<string> {
  const db = getTenantPrisma();
  const ctx = {
    tenantId,
    userId,
    requestId: 'smoke-messaging',
    role: 'OWNER',
    locationScope: 'ALL' as const,
    locationIds: [] as string[],
  };
  const existing = await db.runInTenantContext(ctx, (tx) =>
    tx.service.findFirst({
      where: { tenantId, deletedAt: null, active: true, visibleOnline: true },
      select: { id: true },
    }),
  );
  if (existing?.id) return existing.id;

  const serviceId = idGenerator.next();
  await db.runInTenantContext(ctx, async (tx) => {
    await tx.service.create({
      data: {
        id: serviceId,
        tenantId,
        name: 'Corte Messaging',
        durationMinutes: 40,
        priceCents: 4500n,
        visibleOnline: true,
      },
    });
  });
  return serviceId;
}

async function main(): Promise<void> {
  const worker = await startWorkers();
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolveListen) => server.once('listening', () => resolveListen()));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('porta inválida');
  const port = address.port;

  try {
    const tokenA = await signAccessToken({
      userId: SEED.userAOwner.id,
      tenantId: SEED.tenantA.id,
      role: 'OWNER',
    });
    const tokenB = await signAccessToken({
      userId: SEED.userBOwner.id,
      tenantId: SEED.tenantB.id,
      role: 'OWNER',
    });
    const useWaha = env.MESSAGING_PROVIDER === 'waha';

    const noRisk = await request(port, '/api/v1/messaging/account', {
      method: 'POST',
      token: tokenA,
      body: { riskAccepted: false },
    });
    if (noRisk.status !== 422) fail('POST sem riskAccepted deveria ser 422', noRisk);

    let sessionName = 'ioshua';
    if (useWaha) {
      const existing = await request(port, '/api/v1/messaging/account', { token: tokenA });
      if (existing.status !== 200) fail('GET account navalha (WAHA)', existing);
      const account = dataOf(existing.body);
      if (account.status !== 'CONNECTED') fail('navalha deveria estar CONNECTED no WAHA', account);
      sessionName = (account.sessionName as string) ?? sessionName;
    } else {
      const connect = await request(port, '/api/v1/messaging/account', {
        method: 'POST',
        token: tokenA,
        body: { riskAccepted: true },
      });
      if (connect.status !== 200) fail('POST connect', connect);
      const account = dataOf(connect.body);
      if (account.status !== 'PENDING') fail('status deveria ser PENDING', account);
      sessionName = account.sessionName as string;

      const qr = await request(port, '/api/v1/messaging/account/qr', { token: tokenA });
      if (qr.status !== 200) fail('GET qr', qr);
    }

    const isolated = await request(port, '/api/v1/messaging/account', { token: tokenB });
    if (isolated.status !== 404) fail('tenant B não deveria ver conta de A', isolated);

    const bookTenant = useWaha
      ? { tenantId: SEED.tenantB.id, userId: SEED.userBOwner.id, slug: SEED.tenantB.slug, location: SEED.locationBCentro.slug }
      : { tenantId: SEED.tenantA.id, userId: SEED.userAOwner.id, slug: SEED.tenantA.slug, location: SEED.locationA.slug };

    const serviceId = await ensureServiceId(bookTenant.tenantId, bookTenant.userId);
    const startsAt = await pickPublicSlot(port, bookTenant.slug, bookTenant.location, serviceId);
    const phone = `629${randomUUID().replace(/\D/g, '').slice(0, 8)}`;

    const book = await request(
      port,
      `/api/v1/public/${bookTenant.slug}/${bookTenant.location}/appointments`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': randomUUID() },
        body: {
          serviceIds: [serviceId],
          staffId: null,
          startsAt,
          customer: { name: 'Cliente Messaging', phone, email: 'messaging@example.com' },
          consentDataProcessing: true,
          consentWhatsappMarketing: false,
        },
      },
    );
    if (book.status !== 201) fail('book público', book);
    const booked = dataOf(book.body);
    const appointmentId = booked.id as string;
    const cancelToken = booked.cancelToken as string;

    await worker.drain();
    for (let i = 0; i < 3; i++) {
      await worker.dispatchOnce();
      await new Promise((r) => setTimeout(r, 400));
    }
    await worker.drain();

    const db = getTenantPrisma();
    const ctx = {
      tenantId: bookTenant.tenantId,
      userId: bookTenant.userId,
      requestId: 'smoke-messaging-check',
      role: 'OWNER',
      locationScope: 'ALL' as const,
      locationIds: [] as string[],
    };

    const notifications = await db.runInTenantContext(ctx, (tx) =>
      tx.notification.findMany({ where: { appointmentId }, orderBy: { createdAt: 'asc' } }),
    );
    const confirmation = notifications.find(
      (n) => n.templateKey === MessageTemplateKey.APPOINTMENT_CONFIRMATION,
    );
    if (!confirmation || confirmation.status !== 'SENT') {
      const pending = await db.runInTenantContext(ctx, (tx) =>
        tx.outboxEvent.findMany({
          where: { processedAt: null },
          orderBy: { occurredAt: 'desc' },
          take: 5,
          select: { id: true, name: true, lastError: true },
        }),
      );
      fail('notification confirmação SENT', { notifications, pending });
    }

    const queue = getMessagingQueue();
    const reminder24 = await queue.getJob(
      reminderJobId(bookTenant.tenantId, appointmentId, MessageTemplateKey.REMINDER_24H),
    );
    const reminder2 = await queue.getJob(
      reminderJobId(bookTenant.tenantId, appointmentId, MessageTemplateKey.REMINDER_2H),
    );
    if (!reminder24 || !reminder2) fail('lembretes 24h/2h deveriam estar enfileirados');

    const cancel = await request(
      port,
      `/api/v1/public/${bookTenant.slug}/${bookTenant.location}/appointments/${appointmentId}?token=${cancelToken}`,
      { method: 'DELETE' },
    );
    if (cancel.status !== 200 && cancel.status !== 204) fail('cancel público', cancel);

    await worker.drain();

    const reminder24After = await queue.getJob(
      reminderJobId(bookTenant.tenantId, appointmentId, MessageTemplateKey.REMINDER_24H),
    );
    const reminder2After = await queue.getJob(
      reminderJobId(bookTenant.tenantId, appointmentId, MessageTemplateKey.REMINDER_2H),
    );
    if (reminder24After || reminder2After) fail('lembretes deveriam ser removidos após cancel');

    const payload = {
      id: `smoke-event-${randomUUID()}`,
      event: 'session.status',
      session: sessionName,
      payload: { status: 'WORKING' },
      timestamp: Date.now(),
    };
    const raw = Buffer.from(JSON.stringify(payload));
    const secret = env.WAHA_WEBHOOK_HMAC_KEY ?? env.WAHA_API_KEY ?? 'test';
    const sig = createHmac('sha512', secret).update(raw).digest('hex');
    const hook = await request(port, '/api/v1/webhooks/whatsapp', {
      method: 'POST',
      rawBody: raw,
      headers: { 'X-Webhook-Hmac': sig },
    });
    if (hook.status !== 200) fail('webhook', hook);
    const hookDup = await request(port, '/api/v1/webhooks/whatsapp', {
      method: 'POST',
      rawBody: raw,
      headers: { 'X-Webhook-Hmac': sig },
    });
    if (hookDup.status !== 200) fail('webhook duplicado', hookDup);

    if (!useWaha) {
      const kill = await request(port, '/api/v1/messaging/account', {
        method: 'DELETE',
        token: tokenA,
      });
      if (kill.status !== 200 && kill.status !== 204) fail('kill switch DELETE', kill);
    }

    console.log(useWaha ? 'OK: smoke messaging (WAHA, sem logout da sessão)' : 'OK: smoke messaging (S5 blocos 1–2)');
  } finally {
    server.close();
    await worker.stop();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
