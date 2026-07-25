import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '@/lib/env';

const ENCRYPTION_KEY = env.TOKEN_ENCRYPTION_KEY || '';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const FORMAT_PREFIX = 'enc:';

function getEncryptionKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'TOKEN_ENCRYPTION_KEY is required in production. ' +
        'Generate one with: openssl rand -hex 32'
      );
    }
    // Development fallback - use a deterministic key for local dev only
    return Buffer.from('dev-key-not-for-production-use-32b', 'utf-8');
  }

  // Decode the full 64-char hex string to 32 raw bytes
  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate one with: openssl rand -hex 32'
    );
  }

  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes');
  }
  return key;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: `enc:iv:authTag:ciphertext` (all hex-encoded).
 *
 * @param plaintext - The string to encrypt.
 * @returns The encrypted token in format `enc:iv:authTag:ciphertext`.
 * @throws {Error} If TOKEN_ENCRYPTION_KEY is not configured in production.
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${FORMAT_PREFIX}${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a token previously encrypted with {@link encryptToken}.
 *
 * Security note: In production, TOKEN_ENCRYPTION_KEY must be configured.
 * In development, if the key is missing, this returns the input unchanged
 * to support local development without encryption setup.
 *
 * @param encrypted - The encrypted token in format `enc:iv:authTag:ciphertext`.
 * @returns The decrypted plaintext string.
 * @throws {Error} If the encrypted format is invalid or decryption fails (wrong key, tampered data).
 */
export function decryptToken(encrypted: string): string {
  if (!encrypted.startsWith(FORMAT_PREFIX)) return encrypted;

  // In production, encryption key is mandatory
  if (process.env.NODE_ENV === 'production') {
    const key = getEncryptionKey();
    return decryptWithKey(encrypted, key);
  }

  // Development: graceful fallback if key not set
  try {
    const key = getEncryptionKey();
    return decryptWithKey(encrypted, key);
  } catch {
    // No silent garbage — log the issue and throw a clear error
    console.warn(
      '[encryption] Failed to decrypt token in dev mode. ' +
      'TOKEN_ENCRYPTION_KEY may have changed since encryption. ' +
      'Set a consistent key in .env.local to avoid data loss.'
    );
    throw new Error(
      'Failed to decrypt token — encryption key mismatch or corrupted data. ' +
      'Ensure TOKEN_ENCRYPTION_KEY is consistent across restarts.'
    );
  }
}

function decryptWithKey(encrypted: string, key: Buffer): string {
  const parts = encrypted.split(':');
  if (parts.length < 4) {
    throw new Error(
      'Invalid encrypted token format: expected "enc:iv:authTag:ciphertext" ' +
      `but got ${parts.length} parts`
    );
  }

  const ivHex = parts[1];
  const authTagHex = parts[2];
  const ciphertext = parts.slice(3).join(':');

  if (ivHex.length !== IV_LENGTH * 2) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH * 2} hex chars, got ${ivHex.length}`);
  }
  if (authTagHex.length !== AUTH_TAG_LENGTH * 2) {
    throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH * 2} hex chars, got ${authTagHex.length}`);
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


