import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createApp } from '../src/app.js';
import { SEED } from '../prisma/seeders/constants.js';
import { getPrismaClient } from '../src/shared/database/tenant_prisma.js';
import { hashRefreshToken } from '../src/modules/identity/helpers/refresh_token.js';
import { EmailTokenPurpose } from '../src/modules/identity/enum/auth/email_token_purpose.enum.js';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

const CSRF = { 'X-Requested-With': 'XMLHttpRequest' };

type Json = Record<string, unknown>;

function parseCookie(setCookie: string[] | undefined, name: string): string | undefined {
  if (!setCookie) return undefined;
  for (const header of setCookie) {
    const part = header.split(';')[0];
    if (!part) continue;
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq) === name) return part.slice(eq + 1);
  }
  return undefined;
}

async function request(
  port: number,
  path: string,
  init: {
    method?: string;
    body?: unknown;
    token?: string;
    cookie?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<{ status: number; body: Json; cookie?: string; setCookie: string[] }> {
  const headers: Record<string, string> = { ...(init.headers ?? {}) };
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  if (init.cookie) headers.cookie = `refresh_token=${init.cookie}`;

  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const text = await res.text();
  const body = (text ? JSON.parse(text) : {}) as Json;
  return {
    status: res.status,
    body,
    cookie: parseCookie(setCookie, 'refresh_token'),
    setCookie,
  };
}

function fail(message: string, extra?: unknown): never {
  console.error('FAIL:', message, extra ?? '');
  throw new Error(message);
}

async function main() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolveListen) => server.once('listening', () => resolveListen()));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('porta inválida');
  }
  const port = address.port;
  const suffix = randomUUID().slice(0, 8);
  const email = `owner-${suffix}@signup.local`;
  const password = `Un1que-Smoke-P@ss-${suffix}`;

  try {
    const signup = await request(port, '/api/v1/auth/signup', {
      method: 'POST',
      body: {
        email,
        password,
        tenantName: `Barbearia ${suffix}`,
        phone: '11999990000',
      },
    });
    if (signup.status !== 201) {
      fail('signup deveria ser 201', { status: signup.status, body: signup.body });
    }
    const signupData = signup.body.data as Json | undefined;
    if (!signupData?.accessToken || !signup.cookie) {
      fail('signup deveria devolver accessToken e cookie refresh');
    }
    const user = signupData.user as Json;
    if (user.role !== 'OWNER') fail('signup deveria criar OWNER');

    const tenantId = String(user.tenantId);
    const userId = String(user.id);
    const { getTenantPrisma } = await import('../src/shared/database/tenant_prisma.js');
    const seeded = await getTenantPrisma().runInTenantContext(
      {
        tenantId,
        userId,
        requestId: 'smoke-identity',
        role: 'OWNER',
        locationScope: 'ALL',
        locationIds: [],
      },
      async (tx) => ({
        location: await tx.location.findFirst({ where: { isDefault: true } }),
        locations: await tx.location.count(),
        services: await tx.service.count(),
        hours: await tx.businessHours.count(),
        tenant: await tx.tenant.findUnique({ where: { id: tenantId } }),
      }),
    );
    if (seeded.locations !== 1 || seeded.services !== 3 || seeded.hours !== 6) {
      fail('signup deveria criar 1 unidade, 3 serviços e 6 horários', seeded);
    }
    if (seeded.tenant?.status !== 'TRIALING' || !seeded.tenant.trialEndsAt) {
      fail('tenant deveria nascer TRIALING com trialEndsAt', seeded.tenant);
    }
    if (!seeded.location) fail('signup deveria criar location default');

    const probe = await request(port, `/api/v1/locations/${seeded.location.id}`, {
      token: String(signupData.accessToken),
    });
    if (probe.status !== 200) fail('OWNER deveria ler a unidade recém-criada', probe);

    const dup = await request(port, '/api/v1/auth/signup', {
      method: 'POST',
      body: {
        email,
        password,
        tenantName: `Outra ${suffix}`,
        phone: '11999990001',
      },
    });
    if (dup.status !== 409) fail('e-mail duplicado deveria ser 409', dup);
    const dupError = (dup.body.error as Json | undefined)?.code;
    if (dupError !== 'DUPLICATE_RESOURCE') fail('código DUPLICATE_RESOURCE', dup.body);

    const short = await request(port, '/api/v1/auth/signup', {
      method: 'POST',
      body: {
        email: `short-${suffix}@signup.local`,
        password: 'short',
        tenantName: 'Curta',
        phone: '11999990002',
      },
    });
    if (short.status !== 400) fail('senha curta deveria ser 400', short);

    const login = await request(port, '/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (login.status !== 200 || !login.cookie) fail('login deveria ser 200 com cookie', login);

    const refresh = await request(port, '/api/v1/auth/refresh', {
      method: 'POST',
      cookie: login.cookie,
      headers: CSRF,
    });
    if (refresh.status !== 200 || !refresh.cookie) fail('refresh deveria rotacionar cookie', refresh);

    const reuse = await request(port, '/api/v1/auth/refresh', {
      method: 'POST',
      cookie: login.cookie,
      headers: CSRF,
    });
    if (reuse.status !== 401) fail('reuso de refresh deveria ser 401', reuse);

    const afterReuse = await request(port, '/api/v1/auth/refresh', {
      method: 'POST',
      cookie: refresh.cookie,
      headers: CSRF,
    });
    if (afterReuse.status !== 401) fail('família deveria estar revogada após reuso', afterReuse);

    const login2 = await request(port, '/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (login2.status !== 200 || !login2.cookie) fail('login 2 deveria funcionar', login2);

    const logout = await request(port, '/api/v1/auth/logout', {
      method: 'POST',
      cookie: login2.cookie,
      headers: CSRF,
    });
    if (logout.status !== 200) fail('logout deveria ser 200', logout);

    const refreshAfterLogout = await request(port, '/api/v1/auth/refresh', {
      method: 'POST',
      cookie: login2.cookie,
      headers: CSRF,
    });
    if (refreshAfterLogout.status !== 401) fail('refresh após logout deveria 401', refreshAfterLogout);

    const familyA = await request(port, '/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    const familyB = await request(port, '/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (!familyA.cookie || !familyB.cookie) fail('dois logins deveriam emitir cookies');

    const logoutAll = await request(port, '/api/v1/auth/logout-all', {
      method: 'POST',
      cookie: familyA.cookie,
      headers: CSRF,
    });
    if (logoutAll.status !== 200) fail('logout-all deveria ser 200', logoutAll);

    const refreshA = await request(port, '/api/v1/auth/refresh', {
      method: 'POST',
      cookie: familyA.cookie,
      headers: CSRF,
    });
    const refreshB = await request(port, '/api/v1/auth/refresh', {
      method: 'POST',
      cookie: familyB.cookie,
      headers: CSRF,
    });
    if (refreshA.status !== 401 || refreshB.status !== 401) {
      fail('logout-all deveria revogar as duas famílias', { refreshA, refreshB });
    }

    const seedLogin = await request(port, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: SEED.userAOwner.email, password: SEED.password },
    });
    if (seedLogin.status !== 200) fail('login seed Navalha deveria funcionar', seedLogin);

    const fakeEmail = `missing-${suffix}@signup.local`;
    for (let i = 0; i < 5; i += 1) {
      const failed = await request(port, '/api/v1/auth/login', {
        method: 'POST',
        body: { email: fakeEmail, password: 'Wrongpass10!' },
      });
      if (failed.status !== 401) fail(`falha ${i + 1} deveria ser 401`, failed);
    }
    const limited = await request(port, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: fakeEmail, password: 'Wrongpass10!' },
    });
    if (limited.status !== 429) fail('6ª falha deveria ser 429', limited);

    const ownerLogin = await request(port, '/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    const ownerToken = String((ownerLogin.body.data as Json | undefined)?.accessToken ?? '');
    if (ownerLogin.status !== 200 || !ownerToken) fail('login owner para bloco 2', ownerLogin);

    const me = await request(port, '/api/v1/auth/me', { token: ownerToken });
    if (me.status !== 200) fail('GET /auth/me deveria ser 200', me);

    const users = await request(port, '/api/v1/users', { token: ownerToken });
    if (users.status !== 200) fail('GET /users deveria ser 200', users);
    if (!Array.isArray(users.body.data) || (users.body.data as unknown[]).length < 1) {
      fail('GET /users deveria listar o OWNER', users);
    }
    const meData = me.body.data as Json;
    if (meData.locationIds !== 'ALL' || !Array.isArray(meData.permissions)) {
      fail('me deveria ter locationIds ALL e permissions', meData);
    }

    const inviteEmailAddr = `mgr-${suffix}@signup.local`;
    const invite = await request(port, '/api/v1/users/invitations', {
      method: 'POST',
      token: ownerToken,
      body: {
        email: inviteEmailAddr,
        role: 'MANAGER',
        locationIds: [seeded.location.id],
      },
    });
    if (invite.status !== 201) fail('criar convite deveria ser 201', invite);
    const invitationId = String((invite.body.data as Json).id);

    const listed = await request(port, '/api/v1/users/invitations', { token: ownerToken });
    if (listed.status !== 200) fail('listar convites deveria ser 200', listed);

    const inviteSecret = `smoke-invite-${suffix}`;
    const tenantDb = getTenantPrisma();
    const ownerCtx = {
      tenantId,
      userId,
      requestId: 'smoke-identity',
      role: 'OWNER' as const,
      locationScope: 'ALL' as const,
      locationIds: [] as string[],
    };
    await tenantDb.runInTenantContext(ownerCtx, async (tx) => {
      await tx.invitation.update({
        where: { id: invitationId },
        data: { tokenHash: hashRefreshToken(inviteSecret) },
      });
    });

    const inviteName = 'Gerente Smoke';
    const invitePassword = `Un1que-Mgr-P@ss-${suffix}`;
    const accepted = await request(port, '/api/v1/users/invitations/accept', {
      method: 'POST',
      body: { token: inviteSecret, password: invitePassword, name: inviteName },
    });
    if (accepted.status !== 200) fail('aceitar convite deveria ser 200', accepted);

    const mgrLogin = await request(port, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: inviteEmailAddr, password: invitePassword },
    });
    if (mgrLogin.status !== 200) fail('login do convidado deveria funcionar', mgrLogin);

    const staffEmail = `staff-${suffix}@signup.local`;
    const staffInvite = await request(port, '/api/v1/users/invitations', {
      method: 'POST',
      token: ownerToken,
      body: { email: staffEmail, role: 'STAFF', locationIds: [seeded.location.id] },
    });
    if (staffInvite.status !== 201) fail('convite STAFF deveria ser 201', staffInvite);
    const staffInviteId = String((staffInvite.body.data as Json).id);
    const staffSecret = `smoke-staff-${suffix}`;
    await tenantDb.runInTenantContext(ownerCtx, async (tx) => {
      await tx.invitation.update({
        where: { id: staffInviteId },
        data: { tokenHash: hashRefreshToken(staffSecret) },
      });
    });
    const staffPassword = `Un1que-Stf-P@ss-${suffix}`;
    const staffAccepted = await request(port, '/api/v1/users/invitations/accept', {
      method: 'POST',
      body: { token: staffSecret, password: staffPassword, name: 'Staff Smoke' },
    });
    if (staffAccepted.status !== 200) fail('aceitar STAFF deveria ser 200', staffAccepted);
    const staffLogin = await request(port, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: staffEmail, password: staffPassword },
    });
    const staffToken = String((staffLogin.body.data as Json | undefined)?.accessToken ?? '');
    const staffForbidden = await request(port, '/api/v1/users/invitations', {
      method: 'POST',
      token: staffToken,
      body: { email: `x-${suffix}@signup.local`, role: 'STAFF', locationIds: [seeded.location.id] },
    });
    if (staffForbidden.status !== 403) fail('STAFF convidar deveria ser 403', staffForbidden);

    const demote = await request(port, `/api/v1/users/${userId}`, {
      method: 'PATCH',
      token: ownerToken,
      body: { role: 'MANAGER', locationIds: [seeded.location.id] },
    });
    if (demote.status !== 422) fail('rebaixar último OWNER deveria ser 422', demote);

    const forgotUnknown = await request(port, '/api/v1/auth/password/forgot', {
      method: 'POST',
      body: { email: `ghost-${suffix}@signup.local` },
    });
    if (forgotUnknown.status !== 202) fail('forgot desconhecido deveria ser 202', forgotUnknown);

    const forgotKnown = await request(port, '/api/v1/auth/password/forgot', {
      method: 'POST',
      body: { email },
    });
    if (forgotKnown.status !== 202) fail('forgot conhecido deveria ser 202', forgotKnown);

    const resetSecret = `smoke-reset-${suffix}`;
    await tenantDb.runInTenantContext(ownerCtx, async (tx) => {
      const tokenRow = await tx.emailToken.findFirst({
        where: { userId, purpose: EmailTokenPurpose.PASSWORD_RESET, consumedAt: null },
      });
      if (!tokenRow) throw new Error('token de reset não foi persistido');
      await tx.emailToken.update({
        where: { id: tokenRow.id },
        data: { tokenHash: hashRefreshToken(resetSecret) },
      });
    });
    const newPassword = `Un1que-New-P@ss-${suffix}`;
    const reset = await request(port, '/api/v1/auth/password/reset', {
      method: 'POST',
      body: { token: resetSecret, password: newPassword },
    });
    if (reset.status !== 200) fail('reset deveria ser 200', reset);
    const loginNew = await request(port, '/api/v1/auth/login', {
      method: 'POST',
      body: { email, password: newPassword },
    });
    if (loginNew.status !== 200) fail('login com senha nova deveria funcionar', loginNew);

    const verifySecret = `smoke-verify-${suffix}`;
    await tenantDb.runInTenantContext(ownerCtx, async (tx) => {
      let tokenRow = await tx.emailToken.findFirst({
        where: { userId, purpose: EmailTokenPurpose.EMAIL_VERIFY, consumedAt: null },
      });
      if (!tokenRow) {
        tokenRow = await tx.emailToken.create({
          data: {
            id: randomUUID(),
            tenantId,
            userId,
            purpose: EmailTokenPurpose.EMAIL_VERIFY,
            tokenHash: hashRefreshToken(verifySecret),
            expiresAt: new Date(Date.now() + 60_000),
          },
        });
      } else {
        await tx.emailToken.update({
          where: { id: tokenRow.id },
          data: { tokenHash: hashRefreshToken(verifySecret) },
        });
      }
    });
    const verified = await request(port, '/api/v1/auth/verify-email', {
      method: 'POST',
      body: { token: verifySecret },
    });
    if (verified.status !== 200) fail('verify-email deveria ser 200', verified);

    const extraInvite = await request(port, '/api/v1/users/invitations', {
      method: 'POST',
      token: String((loginNew.body.data as Json).accessToken),
      body: {
        email: `extra-${suffix}@signup.local`,
        role: 'RECEPTIONIST',
        locationIds: [seeded.location.id],
      },
    });
    if (extraInvite.status !== 201) fail('segundo convite deveria ser 201', extraInvite);
    const extraId = String((extraInvite.body.data as Json).id);
    const resend = await request(port, `/api/v1/users/invitations/${extraId}/resend`, {
      method: 'POST',
      token: String((loginNew.body.data as Json).accessToken),
    });
    if (resend.status !== 200) fail('resend deveria ser 200', resend);
    const revoked = await request(port, `/api/v1/users/invitations/${extraId}`, {
      method: 'DELETE',
      token: String((loginNew.body.data as Json).accessToken),
    });
    if (revoked.status !== 200) fail('revoke deveria ser 200', revoked);

    console.log('OK: identity core + convite/me/senha/e-mail');
  } finally {
    server.close();
    await getPrismaClient().$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
