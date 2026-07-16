/** Arbitrary key-value context attached to log entries. */
export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  path?: string;
  method?: string;
  latencyMs?: number;
  statusCode?: number;
  [key: string]: unknown;
}

/** Structured log entry format — always serialized as JSON for machine parsing. */
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: LogContext;
}

type LogTransport = (entry: LogEntry) => void;

// Transport: writes to stdout as JSON (for log aggregation)
function stdoutTransport(entry: LogEntry): void {
  const method = entry.level === 'debug' ? 'debug' : entry.level === 'warn' ? 'warn' : entry.level === 'error' ? 'error' : 'log';
  console[method](JSON.stringify(entry));
}

// Transport: writes errors to Sentry (if configured)
let sentryTransport: LogTransport | null = null;

export function initializeSentryTransport(dsn?: string): void {
  if (!dsn || process.env.NODE_ENV === 'development') return;
  
  // Lazy-load Sentry to avoid bundle overhead
  import('@sentry/nextjs').then(Sentry => {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
      beforeSend(event) {
        // Filter out non-error events
        if (event.level !== 'error') return null;
        return event;
      },
    });
    sentryTransport = (entry: LogEntry) => {
      Sentry.captureException(new Error(entry.message), {
        extra: entry.context,
        tags: {
          action: entry.context?.action,
          path: entry.context?.path,
          level: entry.level,
        },
      });
    };
    if (sentryTransport) transports.push(sentryTransport);
  }).catch(() => {
    // Sentry not available
  });
}

/** Active transports — stdout is always on; Sentry is optional. */
const transports: LogTransport[] = [stdoutTransport];

export function addTransport(transport: LogTransport): void {
  transports.push(transport);
}

/** Internal: dispatches to all transports. */
function dispatch(entry: LogEntry): void {
  for (const t of transports) {
    try {
      t(entry);
    } catch {
      // Transport failure should never crash the app
    }
  }
}

/** Logs an informational message as structured JSON. */
export function logInfo(message: string, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    context,
  };
  dispatch(entry);
}

/** Logs a warning as structured JSON. */
export function logWarn(message: string, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    message,
    context,
  };
  dispatch(entry);
}

/** Logs an error as structured JSON. Extracts name/message/stack from Error instances. */
export function logError(error: unknown, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error',
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined,
    context,
  };
  dispatch(entry);
}

/** Logs a debug message (development only). */
export function logDebug(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === 'development') {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      context,
    };
    dispatch(entry);
  }
}

/** Logs an API call with method and path prefilled in context. */
export function logApiCall(method: string, path: string, context?: LogContext): void {
  logInfo(`API ${method} ${path}`, { method, path, ...context });
}

/** Logs a database operation (debug only). */
export function logDatabaseQuery(operation: string, table: string, context?: LogContext): void {
  logDebug(`Database ${operation} on ${table}`, { operation, table, ...context });
}

/** Logs an authentication event. */
export function logAuthEvent(event: 'login' | 'logout' | 'signup' | 'mfa_enable' | 'mfa_disable', userId: string, context?: LogContext): void {
  logInfo(`Auth ${event}`, { action: `auth_${event}`, userId, ...context });
}

/** Logs a security-relevant event (rate limit hit, failed auth, etc.). */
export function logSecurityEvent(event: 'rate_limit' | 'csrf_failure' | 'invalid_token' | 'unauthorized_access', context?: LogContext): void {
  logWarn(`Security event: ${event}`, { action: `security_${event}`, ...context });
}