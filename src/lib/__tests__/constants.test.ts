import { describe, it, expect } from 'vitest';
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '@/lib/constants';

describe('constants', () => {
  it('APP_NAME is defined and non-empty', () => {
    expect(APP_NAME).toBeDefined();
    expect(APP_NAME.length).toBeGreaterThan(0);
  });

  it('APP_TAGLINE is a non-empty string', () => {
    expect(APP_TAGLINE).toBeDefined();
    expect(typeof APP_TAGLINE).toBe('string');
    expect(APP_TAGLINE.length).toBeGreaterThan(0);
  });

  it('APP_DESCRIPTION is a non-empty string', () => {
    expect(APP_DESCRIPTION).toBeDefined();
    expect(typeof APP_DESCRIPTION).toBe('string');
    expect(APP_DESCRIPTION.length).toBeGreaterThan(0);
  });
});
