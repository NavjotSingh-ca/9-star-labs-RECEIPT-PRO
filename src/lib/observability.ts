/**
 * Observability system — captures all user actions and errors with full context.
 * Stores to localStorage circular buffer (500 entries) and attempts remote logging.
 * SSR-safe with typeof window checks.
 */
'use client';

import { useCallback } from 'react';
import { logError as serverLogError, logWarn as serverLogWarn } from '@/lib/logger';

// ─── Types ──────────────────────────────────────────────────────

export interface ActionLogEntry {
  timestamp: string;
  userId: string | null;
  action: string;
  category: 'navigation' | 'scan' | 'approval' | 'receipt' | 'settings' | 'export' | 'auth' | 'api' | 'ui' | 'system';
  metadata?: Record<string, unknown>;
  duration?: number;
  success: boolean;
  error?: string;
  userAgent?: string;
  url?: string;
}

export interface ErrorLogEntry {
  timestamp: string;
  userId: string | null;
  message: string;
  stack?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  level: 'error' | 'warn' | 'info';
  url?: string;
  userAgent?: string;
}

type LogStore = Array<ActionLogEntry | ErrorLogEntry>;

// ─── Constants ──────────────────────────────────────────────────

const STORAGE_KEY = 'app_observability_logs';
const MAX_LOG_ENTRIES = 500;
const REMOTE_ENDPOINT = '/api/observability/log';

// ─── Storage helpers ────────────────────────────────────────────

function getStoredLogsRaw(): LogStore {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LogStore) : [];
  } catch {
    return [];
  }
}

function persistLogs(logs: LogStore): void {
  if (typeof window === 'undefined') return;
  try {
    // Trim to max size, keeping newest
    const trimmed = logs.slice(-MAX_LOG_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full — clear oldest half
    try {
      const trimmed = logs.slice(-Math.floor(MAX_LOG_ENTRIES / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Silently fail — observability should never throw
    }
  }
}

function addEntry(entry: ActionLogEntry | ErrorLogEntry): void {
  const logs = getStoredLogsRaw();
  logs.push(entry);
  persistLogs(logs);
}

// ─── Context helpers ────────────────────────────────────────────

function getContext(): { userId: string | null; url: string; userAgent: string } {
  return {
    userId: null, // setUserId should be called after auth
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
  };
}

let _userId: string | null = null;

/** Call after auth state is known to associate logs with the current user */
export function setObservabilityUserId(userId: string | null): void {
  _userId = userId;
}

// ─── Core log functions ─────────────────────────────────────────

/** Log a user action (navigation, scan, approval, etc.) */
export function logAction(
  action: string,
  category: ActionLogEntry['category'],
  metadata?: Record<string, unknown>,
): void {
  try {
    const ctx = getContext();
    const entry: ActionLogEntry = {
      timestamp: new Date().toISOString(),
      userId: _userId ?? ctx.userId,
      action,
      category,
      metadata,
      success: true,
      url: ctx.url,
      userAgent: ctx.userAgent,
    };
    addEntry(entry);
    fireAndForgetRemote(entry);
  } catch {
    // Observability should never throw
  }
}

/** Log a user action that failed (with error context) */
export function logActionError(
  action: string,
  category: ActionLogEntry['category'],
  error: unknown,
  metadata?: Record<string, unknown>,
): void {
  try {
    const ctx = getContext();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const entry: ActionLogEntry = {
      timestamp: new Date().toISOString(),
      userId: _userId ?? ctx.userId,
      action,
      category,
      metadata,
      success: false,
      error: errorMessage,
      url: ctx.url,
      userAgent: ctx.userAgent,
    };
    addEntry(entry);
    fireAndForgetRemote(entry);

    // Also log to server-side logger
    serverLogError(error instanceof Error ? error : new Error(errorMessage), {
      action: `observability:${action}`,
      category,
    });
  } catch {
    // Observability should never throw
  }
}

/** Log an application error */
export function logObservedError(
  error: unknown,
  context?: { component?: string; action?: string; metadata?: Record<string, unknown> },
): void {
  try {
    const ctx = getContext();
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      userId: _userId ?? ctx.userId,
      message,
      stack,
      component: context?.component,
      action: context?.action,
      metadata: context?.metadata,
      level: 'error',
      url: ctx.url,
      userAgent: ctx.userAgent,
    };
    addEntry(entry);
    fireAndForgetRemote(entry);

    // Also log to server-side logger
    serverLogError(error instanceof Error ? error : new Error(message), {
      action: `observability:${context?.action ?? 'unknown'}`,
      component: context?.component,
    });
  } catch {
    // Observability should never throw
  }
}

/** Log a warning */
export function logObservedWarn(
  message: string,
  context?: { component?: string; action?: string; metadata?: Record<string, unknown> },
): void {
  try {
    const ctx = getContext();
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      userId: _userId ?? ctx.userId,
      message,
      component: context?.component,
      action: context?.action,
      metadata: context?.metadata,
      level: 'warn',
      url: ctx.url,
      userAgent: ctx.userAgent,
    };
    addEntry(entry);
    fireAndForgetRemote(entry);

    serverLogWarn(message, {
      action: `observability:${context?.action ?? 'unknown'}`,
      component: context?.component,
    });
  } catch {
    // Observability should never throw
  }
}

// ─── Storage query ──────────────────────────────────────────────

/** Get all stored logs */
export function getObservabilityLogs(type?: 'action' | 'error'): LogStore {
  const logs = getStoredLogsRaw();
  if (!type) return logs;
  return logs.filter((entry) => {
    if (type === 'action') return 'action' in entry && 'success' in entry;
    return 'level' in entry;
  });
}

/** Clear all stored logs */
export function clearObservabilityLogs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

// ─── Remote logging (best-effort) ──────────────────────────────

function fireAndForgetRemote(entry: ActionLogEntry | ErrorLogEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = JSON.stringify(entry);
    // Use sendBeacon for reliability during page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon(REMOTE_ENDPOINT, payload);
    } else {
      fetch(REMOTE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Best-effort
      });
    }
  } catch {
    // Best-effort
  }
}

// ─── React Hook ─────────────────────────────────────────────────

export function useActionLogger(): {
  logAction: (action: string, category: ActionLogEntry['category'], metadata?: Record<string, unknown>) => void;
  logError: (error: unknown, context?: { component?: string; action?: string }) => void;
  logWarn: (message: string, context?: { component?: string; action?: string }) => void;
} {
  const logActionStable = useCallback(
    (action: string, category: ActionLogEntry['category'], metadata?: Record<string, unknown>) => {
      logAction(action, category, metadata);
    },
    [],
  );

  const logErrorStable = useCallback(
    (error: unknown, context?: { component?: string; action?: string }) => {
      logObservedError(error, context);
    },
    [],
  );

  const logWarnStable = useCallback(
    (message: string, context?: { component?: string; action?: string }) => {
      logObservedWarn(message, context);
    },
    [],
  );

  return { logAction: logActionStable, logError: logErrorStable, logWarn: logWarnStable };
}
