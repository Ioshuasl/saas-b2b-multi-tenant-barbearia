import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/shared/auth/jwt.js';
import { getTenantPrisma } from '../src/shared/database/tenant_prisma.js';
import { hashRefreshToken } from '../src/modules/identity/helpers/refresh_token.js';
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
  } = {},
): Promise<{ status: number; body: Json }> {
  const headers: Record<string, string> = { ...(init.headers ?? {}) };
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: (text ? JSON.parse(text) : {}) as Json };
}

function fail(message: string, extra?: unknown): never {
  console.error('FAIL:', message, extra ?? '');
  throw new Error(message);
}

function dataOf(body: Json): Json {
  return (body.data ?? body) as Json;
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

  const tokenA = await signAccessToken({
    userId: SEED.userAOwner.id,
    tenantId: SEED.tenantA.id,
    role: 'OWNER',
  });
  const tokenBOwner = await signAccessToken({
    userId: SEED.userBOwner.id,
    tenantId: SEED.tenantB.id,
    role: 'OWNER',
  });
  const tokenBManager = await signAccessToken({
    userId: SEED.userBManager.id,
    tenantId: SEED.tenantB.id,
    role: 'MANAGER',
  });

  const health = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
  if (health.status !== 200) fail('/health deveria ser 200', health.status);

  const aOnB = await request(port, `/api/v1/locations/${SEED.locationBCentro.id}`, { token: tokenA });
  if (aOnB.status !== 404) fail('tenant A em location B deveria 404', aOnB);

  const managerOnJardim = await request(port, `/api/v1/locations/${SEED.locationBJardim.id}`, {
    token: tokenBManager,
  });
  if (managerOnJardim.status !== 404) fail('MANAGER centro em jardim deveria 404', managerOnJardim);

  const managerOnCentro = await request(port, `/api/v1/locations/${SEED.locationBCentro.id}`, {
    token: tokenBManager,
  });
  if (managerOnCentro.status !== 200) fail('MANAGER deveria ler centro', managerOnCentro);

  const ownerBJardin = await request(port, `/api/v1/locations/${SEED.locationBJardim.id}`, {
    token: tokenBOwner,
  });
  const ownerBCentro = await request(port, `/api/v1/locations/${SEED.locationBCentro.id}`, {
    token: tokenBOwner,
  });
  if (ownerBJardin.status !== 200 || ownerBCentro.status !== 200) {
    fail('OWNER B deveria ler as duas unidades');
  }

  const ownerList = await request(port, '/api/v1/locations', { token: tokenBOwner });
  const managerList = await request(port, '/api/v1/locations', { token: tokenBManager });
  const ownerRows = (dataOf(ownerList.body) as unknown as unknown[]) ?? [];
  const managerRows = (dataOf(managerList.body) as unknown as unknown[]) ?? [];
  if (ownerList.status !== 200 || ownerRows.length !== 2) {
    fail('OWNER deveria listar 2 unidades', ownerList);
  }
  if (managerList.status !== 200 || managerRows.length !== 1) {
    fail('MANAGER deveria listar 1 unidade', managerList);
  }

  const managerWrongHeader = await request(port, '/api/v1/locations', {
    token: tokenBManager,
    headers: { 'X-Location-Id': SEED.locationBJardim.id },
  });
  if (managerWrongHeader.status !== 404) {
    fail('X-Location-Id fora do escopo deveria 404', managerWrongHeader);
  }

  const suffix = randomUUID().slice(0, 8);
  const signup = await request(port, '/api/v1/auth/signup', {
    method: 'POST',
    body: {
      email: `owner-${suffix}@loc.local`,
      password: `Un1que-Smoke-P@ss-${suffix}`,
      tenantName: `Barbearia ${suffix}`,
      phone: '+5511999990001',
    },
  });
  if (signup.status !== 201) fail('signup deveria 201', signup);
  const access = String(dataOf(signup.body).accessToken ?? '');
  if (!access) fail('signup sem accessToken', signup);

  const tenant = await request(port, '/api/v1/tenant', { token: access });
  if (tenant.status !== 200) fail('GET /tenant', tenant);

  const patchedTenant = await request(port, '/api/v1/tenant', {
    method: 'PATCH',
    token: access,
    body: { brandColor: '#112233' },
  });
  if (patchedTenant.status !== 200) fail('PATCH /tenant', patchedTenant);

  const locations = await request(port, '/api/v1/locations', { token: access });
  const locRows = dataOf(locations.body) as unknown as Array<{ id: string }>;
  if (locations.status !== 200 || locRows.length !== 1) fail('signup deveria ter 1 unidade', locations);
  const defaultId = locRows[0]?.id;
  if (!defaultId) fail('location id ausente');

  const createdLoc = await request(port, '/api/v1/locations', {
    method: 'POST',
    token: access,
    body: { name: 'Unidade 2', timezone: 'America/Sao_Paulo' },
  });
  if (createdLoc.status !== 201) fail('POST /locations', createdLoc);
  const secondId = String(dataOf(createdLoc.body).id ?? '');

  const patchedLoc = await request(port, `/api/v1/locations/${secondId}`, {
    method: 'PATCH',
    token: access,
    body: { name: 'Unidade 2 editada' },
  });
  if (patchedLoc.status !== 200) fail('PATCH /locations/:id', patchedLoc);

  const locSlug = await request(port, `/api/v1/locations/${defaultId}/slug-available?slug=default`, {
    token: access,
  });
  if (locSlug.status !== 200) fail('GET location slug-available', locSlug);

  const hours = await request(port, `/api/v1/business-hours?locationId=${defaultId}`, {
    token: access,
  });
  if (hours.status !== 200) fail('GET /business-hours', hours);
  const slots = (dataOf(hours.body).slots as unknown[]) ?? [];
  if (slots.length === 0) fail('horários seed do signup ausentes', hours);

  const replaced = await request(port, '/api/v1/business-hours', {
    method: 'PUT',
    token: access,
    body: {
      locationId: defaultId,
      slots: [
        { weekday: 1, startsAt: '09:00', endsAt: '12:00' },
        { weekday: 1, startsAt: '13:00', endsAt: '19:00' },
      ],
    },
  });
  if (replaced.status !== 200) fail('PUT /business-hours', replaced);

  const services = await request(port, '/api/v1/services', { token: access });
  if (services.status !== 200) fail('GET /services', services);
  const serviceRows = dataOf(services.body) as unknown as Array<{ id: string }>;
  if (serviceRows.length < 3) fail('seed de serviços ausente', services);
  const serviceId = serviceRows[0]?.id;
  if (!serviceId) fail('service id ausente');

  const newService = await request(port, '/api/v1/services', {
    method: 'POST',
    token: access,
    body: { name: 'Pigmentação', durationMinutes: 30, priceCents: 4500 },
  });
  if (newService.status !== 201) fail('POST /services', newService);
  const newServiceId = String(dataOf(newService.body).id ?? '');
  const patchedService = await request(port, `/api/v1/services/${newServiceId}`, {
    method: 'PATCH',
    token: access,
    body: { priceCents: 4900 },
  });
  if (patchedService.status !== 200) fail('PATCH /services/:id', patchedService);

  const override = await request(port, `/api/v1/locations/${defaultId}/services/${serviceId}`, {
    method: 'PUT',
    token: access,
    body: { active: true, priceCentsOverride: 5000, durationMinutesOverride: 45 },
  });
  if (override.status !== 200) fail('PUT location service', override);

  const staff = await request(port, '/api/v1/staff', {
    method: 'POST',
    token: access,
    body: { name: 'Carlos', homeLocationId: defaultId, locationIds: [defaultId, secondId] },
  });
  if (staff.status !== 201) fail('POST /staff', staff);
  const staffId = String(dataOf(staff.body).id ?? '');

  const staffList = await request(port, '/api/v1/staff', { token: access });
  if (staffList.status !== 200) fail('GET /staff', staffList);

  const patchedStaff = await request(port, `/api/v1/staff/${staffId}`, {
    method: 'PATCH',
    token: access,
    body: { name: 'Carlos Silva' },
  });
  if (patchedStaff.status !== 200) fail('PATCH /staff/:id', patchedStaff);

  const staffLocs = await request(port, `/api/v1/staff/${staffId}/locations`, {
    method: 'PUT',
    token: access,
    body: { locationIds: [defaultId] },
  });
  if (staffLocs.status !== 200) fail('PUT /staff/:id/locations', staffLocs);

  const staffSvcs = await request(port, `/api/v1/staff/${staffId}/services`, {
    method: 'PUT',
    token: access,
    body: { serviceIds: [serviceId] },
  });
  if (staffSvcs.status !== 200) fail('PUT /staff/:id/services', staffSvcs);

  const block = await request(port, '/api/v1/time-blocks', {
    method: 'POST',
    token: access,
    body: {
      locationId: defaultId,
      startsAt: '2026-08-20T12:00:00.000Z',
      endsAt: '2026-08-20T13:00:00.000Z',
      reason: 'Almoço',
    },
  });
  if (block.status !== 201) fail('POST /time-blocks', block);
  const conflicts = dataOf(block.body).conflicts;
  if (!Array.isArray(conflicts) || conflicts.length !== 0) {
    fail('conflicts deveria ser []', block);
  }
  const blockId = String(dataOf(block.body).id ?? '');

  const listedBlocks = await request(port, `/api/v1/time-blocks?locationId=${defaultId}`, {
    token: access,
  });
  if (listedBlocks.status !== 200) fail('GET /time-blocks', listedBlocks);

  const deletedBlock = await request(port, `/api/v1/time-blocks/${blockId}`, {
    method: 'DELETE',
    token: access,
  });
  if (deletedBlock.status !== 200) fail('DELETE /time-blocks/:id', deletedBlock);

  const onboardGet = await request(port, '/api/v1/tenant/onboarding', { token: access });
  if (onboardGet.status !== 200) fail('GET /tenant/onboarding', onboardGet);

  const onboard = await request(port, '/api/v1/tenant/onboarding', {
    method: 'PATCH',
    token: access,
    body: { step: 'hours' },
  });
  if (onboard.status !== 200) fail('PATCH onboarding hours', onboard);
  const published = await request(port, '/api/v1/tenant/onboarding', {
    method: 'PATCH',
    token: access,
    body: { step: 'publish' },
  });
  if (published.status !== 200 || !dataOf(published.body).public) {
    fail('PATCH onboarding publish', published);
  }

  const slugCheck = await request(port, `/api/v1/tenant/slug-available?slug=admin`, {
    token: access,
  });
  if (slugCheck.status !== 200 || dataOf(slugCheck.body).available !== false) {
    fail('slug admin deveria estar indisponível', slugCheck);
  }

  const invite = await request(port, `/api/v1/staff/${staffId}/invite`, {
    method: 'POST',
    token: access,
    body: { email: `staff-${suffix}@loc.local` },
  });
  if (invite.status !== 201) fail('POST staff invite', invite);

  const staffLoginEmail = `staff-user-${suffix}@loc.local`;
  const staffInvite = await request(port, '/api/v1/users/invitations', {
    method: 'POST',
    token: access,
    body: { email: staffLoginEmail, role: 'STAFF', locationIds: [defaultId] },
  });
  if (staffInvite.status !== 201) fail('convite STAFF', staffInvite);

  const signupUser = dataOf(signup.body).user as Json;
  const tenantId = String(signupUser.tenantId ?? '');
  const ownerUserId = String(signupUser.id ?? '');
  const inviteId = String(dataOf(staffInvite.body).id ?? '');
  const staffSecret = `smoke-loc-staff-${suffix}`;
  await getTenantPrisma().runInTenantContext(
    {
      tenantId,
      userId: ownerUserId,
      requestId: 'smoke-locations',
      role: 'OWNER',
      locationScope: 'ALL',
      locationIds: [],
    },
    async (tx) => {
      await tx.invitation.update({
        where: { id: inviteId },
        data: { tokenHash: hashRefreshToken(staffSecret) },
      });
    },
  );
  const staffPassword = `Un1que-Stf-P@ss-${suffix}`;
  const accepted = await request(port, '/api/v1/users/invitations/accept', {
    method: 'POST',
    body: { token: staffSecret, password: staffPassword, name: 'Staff Loc' },
  });
  if (accepted.status !== 200) fail('aceitar STAFF', accepted);
  const staffLogin = await request(port, '/api/v1/auth/login', {
    method: 'POST',
    body: { email: staffLoginEmail, password: staffPassword },
  });
  const staffToken = String(dataOf(staffLogin.body).accessToken ?? '');
  const staffForbidden = await request(port, '/api/v1/services', {
    method: 'POST',
    token: staffToken,
    body: { name: 'Não pode', durationMinutes: 20 },
  });
  if (staffForbidden.status !== 403) fail('STAFF POST /services deveria ser 403', staffForbidden);

  server.close();
  console.log('OK: locations CRUD + hours + OWNER/MANAGER seletor (M1 probe mantido)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
