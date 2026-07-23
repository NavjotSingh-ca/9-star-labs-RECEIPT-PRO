import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    TOKEN_ENCRYPTION_KEY: '2f4202b54503a36b1a0040c952674d41ad50ded0018e6bd04857b267a22b6c3c',
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
