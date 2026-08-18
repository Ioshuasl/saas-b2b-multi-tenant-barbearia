import { hash, verify, argon2id } from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
} as const;

let dummyHashPromise: Promise<string> | undefined;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

export async function verifyPasswordConstantTime(
  passwordHash: string | null,
  password: string,
): Promise<boolean> {
  dummyHashPromise ??= hashPassword('not-a-real-password');
  const dummy = await dummyHashPromise;
  if (!passwordHash) {
    await verifyPassword(dummy, password);
    return false;
  }
  return verifyPassword(passwordHash, password);
}
