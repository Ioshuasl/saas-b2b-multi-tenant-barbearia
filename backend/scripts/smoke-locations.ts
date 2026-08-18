import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/shared/auth/jwt.js';
import { SEED } from '../prisma/seeders/constants.js';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

async function requestJson(
  port: number,
  path: string,
  token: string,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, body: await res.json() };
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
    locationScope: 'ALL',
    locationIds: [],
  });
  const tokenBOwner = await signAccessToken({
    userId: SEED.userBOwner.id,
    tenantId: SEED.tenantB.id,
    role: 'OWNER',
    locationScope: 'ALL',
    locationIds: [],
  });
  const tokenBManager = await signAccessToken({
    userId: SEED.userBManager.id,
    tenantId: SEED.tenantB.id,
    role: 'MANAGER',
    locationScope: 'RESTRICTED',
    locationIds: [SEED.locationBCentro.id],
  });

  let failed = false;

  const health = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
  if (health.status !== 200) {
    console.error('FAIL: /health deveria ser 200, foi', health.status);
    failed = true;
  }

  const aOnB = await requestJson(port, `/api/v1/locations/${SEED.locationBCentro.id}`, tokenA);
  if (aOnB.status !== 404) {
    console.error('FAIL: tenant A em location B deveria 404, foi', aOnB.status, aOnB.body);
    failed = true;
  }

  const managerOnJardim = await requestJson(
    port,
    `/api/v1/locations/${SEED.locationBJardim.id}`,
    tokenBManager,
  );
  if (managerOnJardim.status !== 404) {
    console.error(
      'FAIL: MANAGER centro em jardim deveria 404, foi',
      managerOnJardim.status,
      managerOnJardim.body,
    );
    failed = true;
  }

  const managerOnCentro = await requestJson(
    port,
    `/api/v1/locations/${SEED.locationBCentro.id}`,
    tokenBManager,
  );
  if (managerOnCentro.status !== 200) {
    console.error('FAIL: MANAGER deveria ler centro, foi', managerOnCentro.status, managerOnCentro.body);
    failed = true;
  }

  const ownerBJardin = await requestJson(
    port,
    `/api/v1/locations/${SEED.locationBJardim.id}`,
    tokenBOwner,
  );
  const ownerBCentro = await requestJson(
    port,
    `/api/v1/locations/${SEED.locationBCentro.id}`,
    tokenBOwner,
  );
  if (ownerBJardin.status !== 200 || ownerBCentro.status !== 200) {
    console.error('FAIL: OWNER B deveria ler as duas unidades');
    failed = true;
  }

  server.close();

  if (failed) process.exit(1);
  console.log('OK: M1 probe GET /locations/:id');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
