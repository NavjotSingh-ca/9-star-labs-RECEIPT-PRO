import { describe, it, expect } from 'vitest';
import {
  handleSupabaseError,
  withRetry,
  isSupabaseError,
} from '@/lib/supabase-error-handler';

describe('handleSupabaseError', () => {
  it('detects network errors', () => {
    const err = new TypeError('Failed to fetch');
    const result = handleSupabaseError(err);
    expect(result.type).toBe('network');
    expect(result.isRetryable).toBe(true);
    expect(result.userMessage).toContain('Network');
  });

  it('detects unique constraint violation (23505)', () => {
    const err = { code: '23505', message: 'duplicate key', details: '', hint: '' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('database');
    expect(result.isRetryable).toBe(false);
    expect(result.userMessage).toContain('already exists');
  });

  it('detects foreign key violation (23503)', () => {
    const err = { code: '23503', message: 'foreign key', details: '', hint: '' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('database');
    expect(result.isRetryable).toBe(false);
    expect(result.userMessage).toContain('does not exist');
  });

  it('detects not-null violation (23502)', () => {
    const err = { code: '23502', message: 'null value', details: '', hint: '' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('database');
    expect(result.userMessage).toContain('missing');
  });

  it('detects check constraint violation (23514)', () => {
    const err = { code: '23514', message: 'check violation', details: '', hint: '' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('database');
    expect(result.userMessage).toContain('validation');
  });

  it('detects connection errors (08006)', () => {
    const err = { code: '08006', message: 'connection', details: '', hint: '' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('database');
    expect(result.isRetryable).toBe(true);
  });

  it('detects timeout errors (57014)', () => {
    const err = { code: '57014', message: 'timeout', details: '', hint: '' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('database');
    expect(result.isRetryable).toBe(true);
  });

  it('handles storage auth error (401)', () => {
    const err = { statusCode: 401, message: 'unauthorized', error: 'unauth' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('storage');
    expect(result.userMessage).toContain('log in again');
  });

  it('handles storage forbidden error (403)', () => {
    const err = { statusCode: 403, message: 'forbidden', error: 'forbidden' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('storage');
    expect(result.userMessage).toContain('permission');
  });

  it('handles storage too large error (413)', () => {
    const err = { statusCode: 413, message: 'too large', error: 'large' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('storage');
    expect(result.userMessage).toContain('too large');
  });

  it('handles storage rate-limit error (429)', () => {
    const err = { statusCode: 429, message: 'rate limit', error: 'rate' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('storage');
    expect(result.isRetryable).toBe(true);
  });

  it('handles storage server error (500+)', () => {
    const err = { statusCode: 503, message: 'unavailable', error: 'down' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('storage');
    expect(result.isRetryable).toBe(true);
  });

  it('handles auth error (401)', () => {
    const err = { status: 401, message: 'unauthorized' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('auth');
    expect(result.userMessage).toContain('log in again');
  });

  it('handles auth forbidden (403)', () => {
    const err = { status: 403, message: 'forbidden' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('auth');
    expect(result.userMessage).toContain('permission');
  });

  it('handles auth rate-limit (429)', () => {
    const err = { status: 429, message: 'too many' };
    const result = handleSupabaseError(err);
    expect(result.type).toBe('auth');
    expect(result.isRetryable).toBe(true);
  });

  it('handles generic Error instance', () => {
    const err = new Error('generic failure');
    const result = handleSupabaseError(err);
    expect(result.type).toBe('unknown');
    expect(result.userMessage).toContain('unexpected error');
  });

  it('handles null/undefined', () => {
    const result = handleSupabaseError(null);
    expect(result.type).toBe('unknown');
    expect(result.userMessage).toContain('unexpected error');
  });
});

describe('withRetry', () => {
  it('resolves on first try', async () => {
    const result = await withRetry(() => 'success');
    expect(result).toBe('success');
  });

  it('retries on retryable error and resolves', async () => {
    let attempts = 0;
    const result = await withRetry(() => {
      attempts++;
      if (attempts < 3) throw { code: '08006', message: 'conn', details: '', hint: '' };
      return 'ok';
    }, { maxRetries: 3, delayMs: 10 });
    expect(result).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('throws on non-retryable error', async () => {
    await expect(withRetry(() => {
      throw { code: '23505', message: 'dup', details: '', hint: '' };
    })).rejects.toHaveProperty('type', 'database');
  });

  it('throws after exhausting retries', async () => {
    await expect(withRetry(() => {
      throw { code: '08006', message: 'conn', details: '', hint: '' };
    }, { maxRetries: 2, delayMs: 10 })).rejects.toHaveProperty('type', 'database');
  });

  it('calls onRetry callback', async () => {
    let retryCalled = false;
    let attempts = 0;
    await withRetry(() => {
      attempts++;
      if (attempts < 2) throw { code: '08006', message: 'conn', details: '', hint: '' };
      return 'ok';
    }, {
      maxRetries: 2,
      delayMs: 10,
      onRetry: () => { retryCalled = true; },
    });
    expect(retryCalled).toBe(true);
  });
});

describe('isSupabaseError', () => {
  it('returns true for SupabaseError-shaped object', () => {
    expect(isSupabaseError({ type: 'database', userMessage: 'err' })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isSupabaseError(null)).toBe(false);
  });

  it('returns false for plain string', () => {
    expect(isSupabaseError('error')).toBe(false);
  });
});
