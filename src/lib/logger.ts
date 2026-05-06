export interface LogContext {
  userId?: string;
  action?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

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

export function logInfo(message: string, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    context
  };

  console.log(JSON.stringify(entry));
}

export function logWarn(message: string, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    message,
    context
  };

  console.warn(JSON.stringify(entry));
}

export function logError(error: unknown, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error instanceof Error ? error.message : 'Unknown error',
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined,
    context
  };

  console.error(JSON.stringify(entry));
}

export function logDebug(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === 'development') {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      context
    };

    console.debug(JSON.stringify(entry));
  }
}

export function logApiCall(method: string, path: string, context?: LogContext): void {
  logInfo(`API ${method} ${path}`, {
    ...context,
    method,
    path
  });
}

export function logDatabaseQuery(operation: string, table: string, context?: LogContext): void {
  logDebug(`Database ${operation} on ${table}`, {
    ...context,
    operation,
    table
  });
}
