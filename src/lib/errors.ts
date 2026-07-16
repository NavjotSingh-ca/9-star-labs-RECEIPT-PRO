/**
 * Standardized application error class with rich context for debugging
 * and user-friendly messages for production.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly retryable: boolean;
  public readonly context: Record<string, unknown>;
  public readonly timestamp: string;
  public readonly requestId?: string;

  constructor(options: {
    code: string;
    message: string;
    userMessage?: string;
    statusCode?: number;
    retryable?: boolean;
    context?: Record<string, unknown>;
    requestId?: string;
    cause?: Error;
  }) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.statusCode = options.statusCode ?? 500;
    this.userMessage = options.userMessage ?? 'An unexpected error occurred. Please try again.';
    this.retryable = options.retryable ?? false;
    this.context = options.context ?? {};
    this.timestamp = new Date().toISOString();
    this.requestId = options.requestId;
    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Create a validation error (400)
   */
  static validation(message: string, context?: Record<string, unknown>, requestId?: string): AppError {
    return new AppError({
      code: 'VALIDATION_ERROR',
      message,
      userMessage: 'Please check your input and try again.',
      statusCode: 400,
      retryable: false,
      context,
      requestId,
    });
  }

  /**
   * Create an authentication error (401)
   */
  static unauthorized(message: string = 'Authentication required', context?: Record<string, unknown>, requestId?: string): AppError {
    return new AppError({
      code: 'UNAUTHORIZED',
      message,
      userMessage: 'Please sign in to continue.',
      statusCode: 401,
      retryable: false,
      context,
      requestId,
    });
  }

  /**
   * Create an authorization error (403)
   */
  static forbidden(message: string = 'Access denied', context?: Record<string, unknown>, requestId?: string): AppError {
    return new AppError({
      code: 'FORBIDDEN',
      message,
      userMessage: 'You do not have permission to perform this action.',
      statusCode: 403,
      retryable: false,
      context,
      requestId,
    });
  }

  /**
   * Create a not found error (404)
   */
  static notFound(resource: string = 'Resource', context?: Record<string, unknown>, requestId?: string): AppError {
    return new AppError({
      code: 'NOT_FOUND',
      message: `${resource} not found`,
      userMessage: `${resource} could not be found.`,
      statusCode: 404,
      retryable: false,
      context,
      requestId,
    });
  }

  /**
   * Create a rate limit error (429)
   */
  static rateLimited(retryAfter: number, context?: Record<string, unknown>, requestId?: string): AppError {
    return new AppError({
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded',
      userMessage: 'Too many requests. Please wait a moment and try again.',
      statusCode: 429,
      retryable: true,
      context: { ...context, retryAfter },
      requestId,
    });
  }

  /**
   * Create an internal server error (500)
   */
  static internal(message: string, context?: Record<string, unknown>, requestId?: string): AppError {
    return new AppError({
      code: 'INTERNAL_ERROR',
      message,
      userMessage: 'Something went wrong on our end. Please try again later.',
      statusCode: 500,
      retryable: true,
      context,
      requestId,
    });
  }

  /**
   * Create a service unavailable error (503)
   */
  static serviceUnavailable(service: string, context?: Record<string, unknown>, requestId?: string): AppError {
    return new AppError({
      code: 'SERVICE_UNAVAILABLE',
      message: `${service} is currently unavailable`,
      userMessage: 'This feature is temporarily unavailable. Please try again later.',
      statusCode: 503,
      retryable: true,
      context: { ...context, service },
      requestId,
    });
  }

  /**
   * Create an error from an unknown error (catch-all)
   */
  static fromUnknown(error: unknown, context?: Record<string, unknown>, requestId?: string): AppError {
    if (error instanceof AppError) return error;
    
    const message = error instanceof Error ? error.message : String(error);
    return new AppError({
      code: 'UNKNOWN_ERROR',
      message,
      userMessage: 'An unexpected error occurred. Please try again.',
      statusCode: 500,
      retryable: true,
      context: { ...context, originalError: message },
      requestId,
      cause: error instanceof Error ? error : undefined,
    });
  }

  /**
   * Convert to a safe JSON-serializable object for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      retryable: this.retryable,
      context: this.context,
      timestamp: this.timestamp,
      requestId: this.requestId,
      stack: this.stack,
      cause: this.cause instanceof Error ? this.cause.message : this.cause,
    };
  }

  /**
   * Convert to a NextResponse for API routes
   */
  toResponse(): Response {
    return Response.json(
      { error: this.userMessage, code: this.code },
      { status: this.statusCode }
    );
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = AppError> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Create a success result
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create an error result
 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Try to execute a function and return a Result
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  onError?: (error: unknown) => AppError
): Promise<Result<T, AppError>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    return err(onError ? onError(error) : AppError.fromUnknown(error));
  }
}

/**
 * Synchronous version of tryCatch
 */
export function tryCatchSync<T>(
  fn: () => T,
  onError?: (error: unknown) => AppError
): Result<T, AppError> {
  try {
    const value = fn();
    return ok(value);
  } catch (error) {
    return err(onError ? onError(error) : AppError.fromUnknown(error));
  }
}