import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
import { randomUUID } from 'node:crypto';
import { env, jwtPrivateKey, jwtPublicKey } from '../config/env.js';

const ACCESS_TOKEN_TTL = '15m';
const JWT_KID = 'v1';

export type AccessTokenClaims = {
  sub: string;
  tenantId: string;
  role: string;
  staffId?: string;
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
  staffId?: string;
}): Promise<string> {
  const key = await getPrivateKey();
  const jti = randomUUID();

  const claims: Record<string, string> = {
    tenantId: input.tenantId,
    role: input.role,
  };
  if (input.staffId) {
    claims.staffId = input.staffId;
  }

  return new SignJWT(claims)
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
  const staffId = payload.staffId;
  const jti = payload.jti;

  if (
    typeof sub !== 'string' ||
    typeof tenantId !== 'string' ||
    typeof role !== 'string' ||
    typeof jti !== 'string' ||
    (staffId !== undefined && typeof staffId !== 'string')
  ) {
    throw new Error('JWT claims inválidos.');
  }

  return {
    sub,
    tenantId,
    role,
    staffId: typeof staffId === 'string' ? staffId : undefined,
    jti,
    exp: payload.exp ?? 0,
    iat: payload.iat ?? 0,
  };
}
