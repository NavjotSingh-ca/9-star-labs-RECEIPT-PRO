import { PostgrestError } from '@supabase/supabase-js';

export interface SupabaseError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
  type: 'database' | 'storage' | 'auth' | 'network' | 'unknown';
  isRetryable: boolean;
  userMessage: string;
}

export function handleSupabaseError(error: unknown): SupabaseError {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: error.message,
      isRetryable: true,
      userMessage: 'Network connection error. Please check your internet connection.',
    };
  }

  // Postgrest database errors
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError;

    // Constraint violations
    if (pgError.code === '23505') {
      return {
        code: pgError.code,
        message: pgError.message,
        details: pgError.details,
        hint: pgError.hint,
        type: 'database',
        isRetryable: false,
        userMessage: 'This record already exists or violates a unique constraint.',
      };
    }

    // Foreign key violations
    if (pgError.code === '23503') {
      return {
        code: pgError.code,
        message: pgError.message,
        details: pgError.details,
        hint: pgError.hint,
        type: 'database',
        isRetryable: false,
        userMessage: 'Referenced record does not exist.',
      };
    }

    // Not null violations
    if (pgError.code === '23502') {
      return {
        code: pgError.code,
        message: pgError.message,
        details: pgError.details,
        hint: pgError.hint,
        type: 'database',
        isRetryable: false,
        userMessage: 'Required field is missing.',
      };
    }

    // Check constraint violations
    if (pgError.code === '23514') {
      return {
        code: pgError.code,
        message: pgError.message,
        details: pgError.details,
        hint: pgError.hint,
        type: 'database',
        isRetryable: false,
        userMessage: 'Data validation failed.',
      };
    }

    // Connection errors
    if (pgError.code === '08006' || pgError.code === '08001') {
      return {
        code: pgError.code,
        message: pgError.message,
        details: pgError.details,
        hint: pgError.hint,
        type: 'database',
        isRetryable: true,
        userMessage: 'Database connection error. Please try again.',
      };
    }

    // Timeout errors
    if (pgError.code === '57014') {
      return {
        code: pgError.code,
        message: pgError.message,
        details: pgError.details,
        hint: pgError.hint,
        type: 'database',
        isRetryable: true,
        userMessage: 'Request timed out. Please try again.',
      };
    }

    // Generic database error
    return {
      code: pgError.code,
      message: pgError.message,
      details: pgError.details,
      hint: pgError.hint,
      type: 'database',
      isRetryable: false,
      userMessage: 'Database error occurred. Please try again.',
    };
  }

  // Storage errors
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const storageError = error as { statusCode: number; message: string; error: string };

    if (storageError.statusCode === 401) {
      return {
        type: 'storage',
        message: storageError.message,
        isRetryable: false,
        userMessage: 'Storage authentication failed. Please log in again.',
      };
    }

    if (storageError.statusCode === 403) {
      return {
        type: 'storage',
        message: storageError.message,
        isRetryable: false,
        userMessage: 'You do not have permission to access this resource.',
      };
    }

    if (storageError.statusCode === 413) {
      return {
        type: 'storage',
        message: storageError.message,
        isRetryable: false,
        userMessage: 'File is too large. Please upload a smaller file.',
      };
    }

    if (storageError.statusCode === 429) {
      return {
        type: 'storage',
        message: storageError.message,
        isRetryable: true,
        userMessage: 'Too many requests. Please wait and try again.',
      };
    }

    if (storageError.statusCode >= 500) {
      return {
        type: 'storage',
        message: storageError.message,
        isRetryable: true,
        userMessage: 'Storage service error. Please try again.',
      };
    }

    return {
      type: 'storage',
      message: storageError.message,
      isRetryable: false,
      userMessage: 'Storage error occurred.',
    };
  }

  // Auth errors
  if (error && typeof error === 'object' && 'status' in error) {
    const authError = error as { status: number; message: string };

    if (authError.status === 401) {
      return {
        type: 'auth',
        message: authError.message,
        isRetryable: false,
        userMessage: 'Authentication failed. Please log in again.',
      };
    }

    if (authError.status === 403) {
      return {
        type: 'auth',
        message: authError.message,
        isRetryable: false,
        userMessage: 'You do not have permission to perform this action.',
      };
    }

    if (authError.status === 429) {
      return {
        type: 'auth',
        message: authError.message,
        isRetryable: true,
        userMessage: 'Too many authentication attempts. Please wait.',
      };
    }
  }

  // Generic error
  if (error instanceof Error) {
    return {
      type: 'unknown',
      message: error.message,
      isRetryable: false,
      userMessage: 'An unexpected error occurred. Please try again.',
    };
  }

  return {
    type: 'unknown',
    message: 'Unknown error',
    isRetryable: false,
    userMessage: 'An unexpected error occurred. Please try again.',
  };
}

export async function withRetry<T>(
  operation: () => Promise<T> | T,
  options: {
    maxRetries?: number;
    delayMs?: number;
    onRetry?: (attempt: number, error: SupabaseError) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, onRetry } = options;
  let lastError: SupabaseError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = operation();
      // Handle both Promise and non-Promise results
      return result instanceof Promise ? await result : result as T;
    } catch (error) {
      lastError = handleSupabaseError(error);

      // Don't retry non-retryable errors
      if (!lastError.isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt);

      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function isSupabaseError(error: unknown): error is SupabaseError {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'type' in error &&
    'userMessage' in error
  );
}
