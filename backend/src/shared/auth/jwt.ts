import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
import { randomUUID } from 'node:crypto';
import { env, jwtPrivateKey, jwtPublicKey } from '../config/env.js';
import type { LocationScope } from '../domain/request_context.js';

const ACCESS_TOKEN_TTL = '15m';
const JWT_KID = 'v1';

export type AccessTokenClaims = {
  sub: string;
  tenantId: string;
  role: string;
  locationScope: LocationScope;
  locationIds: string[];
  jti: string;
};

export type VerifiedAccessToken = AccessTokenClaims & {
  exp: number;
  iat: number;
};

let privateKeyPromise: ReturnType<typeof importPKCS8> | undefined;
let publicKeyPromise: ReturnType<typeof importSPKI> | undefined;

async function getPrivateKey() {
  if (!privateKeyPromise) {
    privateKeyPromise = importPKCS8(jwtPrivateKey, 'RS256');
  }
  return privateKeyPromise;
}

async function getPublicKey() {
  if (!publicKeyPromise) {
    publicKeyPromise = importSPKI(jwtPublicKey, 'RS256');
  }
  return publicKeyPromise;
}

export async function signAccessToken(input: {
  userId: string;
  tenantId: string;
  role: string;
  locationScope: LocationScope;
  locationIds: readonly string[];
}): Promise<string> {
  const key = await getPrivateKey();
  const jti = randomUUID();

  return new SignJWT({
    tenantId: input.tenantId,
    role: input.role,
    locationScope: input.locationScope,
    locationIds: [...input.locationIds],
  })
    .setProtectedHeader({ alg: 'RS256', kid: JWT_KID })
    .setSubject(input.userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .setIssuer(env.APP_PUBLIC_URL)
    .sign(key);
}

export async function verifyAccessToken(token: string): Promise<VerifiedAccessToken> {
  const key = await getPublicKey();
  const { payload } = await jwtVerify(token, key, {
    algorithms: ['RS256'],
    issuer: env.APP_PUBLIC_URL,
  });

  const sub = payload.sub;
  const tenantId = payload.tenantId;
  const role = payload.role;
  const locationScope = payload.locationScope;
  const locationIds = payload.locationIds;
  const jti = payload.jti;

  if (
    typeof sub !== 'string' ||
    typeof tenantId !== 'string' ||
    typeof role !== 'string' ||
    (locationScope !== 'ALL' && locationScope !== 'RESTRICTED') ||
    !Array.isArray(locationIds) ||
    !locationIds.every((id) => typeof id === 'string') ||
    typeof jti !== 'string'
  ) {
    throw new Error('JWT claims inválidos.');
  }

  return {
    sub,
    tenantId,
    role,
    locationScope,
    locationIds,
    jti,
    exp: payload.exp ?? 0,
    iat: payload.iat ?? 0,
  };
}
