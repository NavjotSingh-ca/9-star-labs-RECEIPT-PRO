import { describe, it, expect } from 'vitest';

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

describe('sanitizeFilename', () => {
  it('allows safe filenames', () => {
    expect(sanitizeFilename('receipt.jpg')).toBe('receipt.jpg');
  });

  it('replaces path traversal chars', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('.._.._.._etc_passwd');
  });

  it('handles empty string', () => {
    expect(sanitizeFilename('')).toBe('');
  });
});
