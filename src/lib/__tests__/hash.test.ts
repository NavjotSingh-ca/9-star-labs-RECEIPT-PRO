import { describe, it, expect } from 'vitest';
import {
  generateSHA256,
  generateDuplicateHash,
  generateIntegrityHash,
  generateAuditEventHash,
  verifyHashFormat,
} from '@/lib/hash';

describe('generateSHA256', () => {
  it('produces a 64-char hex string', async () => {
    const hash = await generateSHA256('hello');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic', async () => {
    const a = await generateSHA256('test-data');
    const b = await generateSHA256('test-data');
    expect(a).toBe(b);
  });

  it('produces different hashes for different inputs', async () => {
    const a = await generateSHA256('input-a');
    const b = await generateSHA256('input-b');
    expect(a).not.toBe(b);
  });

  it('handles empty string', async () => {
    const hash = await generateSHA256('');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('generateDuplicateHash', () => {
  it('produces a 64-char hex hash', async () => {
    const hash = await generateDuplicateHash('Walmart', '2026-06-01', '42.50');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('normalises vendor name (trim, lowercase, collapse spaces)', async () => {
    const a = await generateDuplicateHash('  WALMART ', '2026-06-01', '42.50');
    const b = await generateDuplicateHash('walmart', '2026-06-01', '42.50');
    expect(a).toBe(b);
  });

  it('normalises total to 2 decimal places', async () => {
    const a = await generateDuplicateHash('Walmart', '2026-06-01', 42.5);
    const b = await generateDuplicateHash('Walmart', '2026-06-01', '42.50');
    expect(a).toBe(b);
  });

  it('different dates produce different hashes', async () => {
    const a = await generateDuplicateHash('Walmart', '2026-06-01', '42.50');
    const b = await generateDuplicateHash('Walmart', '2026-06-02', '42.50');
    expect(a).not.toBe(b);
  });
});

describe('generateIntegrityHash', () => {
  it('hashes an ArrayBuffer', async () => {
    const buf = new TextEncoder().encode('file content').buffer;
    const hash = await generateIntegrityHash(buf);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hashes a Uint8Array', async () => {
    const arr = new TextEncoder().encode('file content');
    const hash = await generateIntegrityHash(arr);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('throws on empty buffer', async () => {
    await expect(generateIntegrityHash(new ArrayBuffer(0))).rejects.toThrow('empty buffer');
  });
});

describe('generateAuditEventHash', () => {
  it('produces a valid hash from previous hash and event data', async () => {
    const prev = 'a'.repeat(64);
    const hash = await generateAuditEventHash(prev, { action: 'create', entity: 'receipt' });
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('throws on invalid previous hash', async () => {
    await expect(generateAuditEventHash('short', {})).rejects.toThrow('Invalid previous hash');
  });

  it('handles event with empty keys', async () => {
    const prev = 'a'.repeat(64);
    const hash = await generateAuditEventHash(prev, { key: 'value' });
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('verifyHashFormat', () => {
  it('returns true for valid SHA-256 hash', () => {
    expect(verifyHashFormat('a'.repeat(64))).toBe(true);
  });

  it('returns false for short string', () => {
    expect(verifyHashFormat('abc')).toBe(false);
  });

  it('returns false for non-hex characters', () => {
    expect(verifyHashFormat('z' + 'a'.repeat(63))).toBe(false);
  });

  it('returns false for null-ish values', () => {
    expect(verifyHashFormat('')).toBe(false);
  });
});
