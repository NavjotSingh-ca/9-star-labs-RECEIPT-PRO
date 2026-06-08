import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    TOKEN_ENCRYPTION_KEY: 'test-key-1234567890abcdef1234567890abcdef',
  },
}));

const { encryptToken, decryptToken } = await import('@/lib/encryption');

describe('encryptToken / decryptToken', () => {
  it('encrypts and decrypts a token', () => {
    const original = 'my-secret-token-123';
    const encrypted = encryptToken(original);
    expect(encrypted).toMatch(/^enc:[a-f0-9]+:[a-f0-9]+:/);
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(original);
  });

  it('produces different ciphertext each time for the same plaintext', () => {
    const original = 'same-value';
    const a = encryptToken(original);
    const b = encryptToken(original);
    expect(a).not.toBe(b);
  });

  it('passes through non-encrypted strings in decryptToken', () => {
    const result = decryptToken('plaintext');
    expect(result).toBe('plaintext');
  });
});
