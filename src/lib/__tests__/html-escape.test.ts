import { describe, it, expect } from 'vitest';
import { escapeHtml } from '@/lib/html-escape';

describe('escapeHtml', () => {
  it('escapes & < > "', () => {
    expect(escapeHtml('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('escapes ampersands first', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('passes through safe strings', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('handles null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});
