import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const SALT_BYTES = 16;
const HASH_BYTES = 32;
const MAX_PASSWORD_BYTES = 1024;
export const MIN_PROVISIONED_PASSWORD_LENGTH = 8;
const HASH_FORMAT = /^scrypt-v1:([a-f0-9]{32}):([a-f0-9]{64})$/;
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

export function isLoginPasswordValid(password: unknown): password is string {
  return (
    typeof password === 'string' &&
    password.length > 0 &&
    Buffer.byteLength(password) <= MAX_PASSWORD_BYTES
  );
}

export function isProvisioningPasswordValid(
  password: unknown,
): password is string {
  return (
    isLoginPasswordValid(password) &&
    [...password].length >= MIN_PROVISIONED_PASSWORD_LENGTH
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await deriveKey(password, salt);

  return `scrypt-v1:${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function isPasswordHash(value: unknown): value is string {
  return typeof value === 'string' && HASH_FORMAT.test(value);
}

export async function verifyPassword(
  password: string,
  encodedHash?: string,
): Promise<boolean> {
  const parsedHash = encodedHash ? HASH_FORMAT.exec(encodedHash) : null;
  const salt = parsedHash
    ? Buffer.from(parsedHash[1], 'hex')
    : Buffer.alloc(SALT_BYTES);
  const expected = parsedHash
    ? Buffer.from(parsedHash[2], 'hex')
    : Buffer.alloc(HASH_BYTES);
  const hash = await deriveKey(password, salt);
  const matches = timingSafeEqual(hash, expected);

  return !!parsedHash && matches;
}

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, HASH_BYTES, SCRYPT_OPTIONS, (error, result) => {
      if (error) {
        reject(error);

        return;
      }

      resolve(result);
    });
  });
}
