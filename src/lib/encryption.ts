import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '@/lib/env';

const ENCRYPTION_KEY = env.TOKEN_ENCRYPTION_KEY || '';

export function encryptToken(plaintext: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    console.error('[Encryption] TOKEN_ENCRYPTION_KEY not configured — storing token in plaintext');
    return plaintext;
  }
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf-8');
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptToken(encrypted: string): string {
  if (!encrypted.startsWith('enc:')) return encrypted;
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) return encrypted;
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf-8');
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[1], 'hex');
  const authTag = Buffer.from(parts[2], 'hex');
  const encryptedText = parts.slice(3).join(':');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
