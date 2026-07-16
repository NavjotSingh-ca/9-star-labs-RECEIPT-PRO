import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logInfo, logWarn, logError, logDebug, logApiCall, logDatabaseQuery } from '@/lib/logger';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv('NODE_ENV', 'development');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('logInfo', () => {
  it('logs a JSON stringified entry', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logInfo('test message', { userId: 'u1' });
    expect(spy).toHaveBeenCalledOnce();
    const call = JSON.parse(spy.mock.calls[0][0]);
    expect(call.level).toBe('info');
    expect(call.message).toBe('test message');
    expect(call.context?.userId).toBe('u1');
    expect(call).toHaveProperty('timestamp');
  });
});

describe('logWarn', () => {
  it('logs a warning entry', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logWarn('warning');
    expect(spy).toHaveBeenCalledOnce();
    const call = JSON.parse(spy.mock.calls[0][0]);
    expect(call.level).toBe('warn');
    expect(call.message).toBe('warning');
  });
});

describe('logError', () => {
  it('logs an error entry with Error object', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('something broke');
    logError(err, { action: 'test' });
    expect(spy).toHaveBeenCalledOnce();
    const call = JSON.parse(spy.mock.calls[0][0]);
    expect(call.level).toBe('error');
    expect(call.message).toBe('something broke');
    expect(call.error?.name).toBe('Error');
    expect(call.context?.action).toBe('test');
  });

  it('logs an error entry with string', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logError('string error');
    expect(spy).toHaveBeenCalledOnce();
    const call = JSON.parse(spy.mock.calls[0][0]);
    expect(call.message).toBe('string error');
    expect(call.error).toBeUndefined();
  });

  it('logs an error entry with null', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logError(null);
    expect(spy).toHaveBeenCalledOnce();
    const call = JSON.parse(spy.mock.calls[0][0]);
    expect(call.message).toBe('Unknown error');
  });
});

describe('logDebug', () => {
  it('logs in development', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logDebug('debug msg');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('does not log in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logDebug('debug msg');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('logApiCall', () => {
  it('logs method and path', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logApiCall('GET', '/api/receipts');
    expect(spy).toHaveBeenCalledOnce();
    const call = JSON.parse(spy.mock.calls[0][0]);
    expect(call.message).toBe('API GET /api/receipts');
    expect(call.context?.method).toBe('GET');
    expect(call.context?.path).toBe('/api/receipts');
  });
});

describe('logDatabaseQuery', () => {
  it('logs operation and table in development', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logDatabaseQuery('INSERT', 'receipts');
    expect(spy).toHaveBeenCalledOnce();
    const call = JSON.parse(spy.mock.calls[0][0]);
    expect(call.message).toBe('Database INSERT on receipts');
    expect(call.context?.operation).toBe('INSERT');
    expect(call.context?.table).toBe('receipts');
  });
});
