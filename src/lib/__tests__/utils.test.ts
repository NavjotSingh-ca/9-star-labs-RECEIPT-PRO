import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', 'visible');
    expect(result).toBe('base visible');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    const result = cn('px-4', 'px-6');
    expect(result).toBe('px-6');
  });

  it('handles array inputs', () => {
    const result = cn(['a', 'b'], 'c');
    expect(result).toBe('a b c');
  });

  it('handles object inputs', () => {
    const result = cn({ foo: true, bar: false });
    expect(result).toBe('foo');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('handles nullish values', () => {
    expect(cn(null, undefined, 'a')).toBe('a');
  });
});
