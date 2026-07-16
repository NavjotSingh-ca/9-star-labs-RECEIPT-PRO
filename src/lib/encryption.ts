import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '@/lib/env';

const ENCRYPTION_KEY = env.TOKEN_ENCRYPTION_KEY || '';
const KEY_MIN_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const FORMAT_PREFIX = 'enc:';

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: `enc:iv:authTag:ciphertext` (all hex-encoded).
 *
 * @param plaintext - The string to encrypt.
 * @returns The encrypted token in format `enc:iv:authTag:ciphertext`.
 * @throws {Error} If TOKEN_ENCRYPTION_KEY is not set or is shorter than 32 characters.
 */
export function encryptToken(plaintext: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < KEY_MIN_LENGTH) {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY must be at least 32 characters for AES-256-GCM encryption. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, KEY_MIN_LENGTH), 'utf-8');
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
 * Security note: When TOKEN_ENCRYPTION_KEY is not configured, this function
 * returns the input unchanged (plaintext passthrough). This is intentional
 * to support development environments where encryption setup is deferred.
 * Never use this fallback in production.
 *
 * @param encrypted - The encrypted token in format `enc:iv:authTag:ciphertext`.
 * @returns The decrypted plaintext string.
 * @throws {Error} If the encrypted format is invalid or decryption fails (wrong key, tampered data).
 */
export function decryptToken(encrypted: string): string {
  if (!encrypted.startsWith(FORMAT_PREFIX)) return encrypted;
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < KEY_MIN_LENGTH) return encrypted;

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

  const key = Buffer.from(ENCRYPTION_KEY.slice(0, KEY_MIN_LENGTH), 'utf-8');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
