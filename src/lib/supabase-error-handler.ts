import type { PostgrestError } from '@supabase/supabase-js';

/** Classified Supabase error with a user-facing message and retry guidance. */
export interface SupabaseError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
  type: 'database' | 'storage' | 'auth' | 'network' | 'unknown';
  isRetryable: boolean;
  userMessage: string;
}

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  onRetry?: (attempt: number, error: SupabaseError) => void;
}

/**
 * Classifies an unknown error from Supabase into a structured {@link SupabaseError}.
 * Handles network errors, PostgREST database errors (by code), storage errors (by statusCode),
 * and auth errors (by status).
 *
 * @param error - The raw error from a Supabase operation.
 * @returns A classified error with a user-facing message.
 */
export function handleSupabaseError(error: unknown): SupabaseError {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: error.message,
      isRetryable: true,
      userMessage: 'Network connection error. Please check your internet connection.',
    };
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError;

    switch (pgError.code) {
      case '23505':
        return {
          code: pgError.code, message: pgError.message, details: pgError.details, hint: pgError.hint,
          type: 'database', isRetryable: false,
          userMessage: 'This record already exists or violates a unique constraint.',
        };
      case '23503':
        return {
          code: pgError.code, message: pgError.message, details: pgError.details, hint: pgError.hint,
          type: 'database', isRetryable: false,
          userMessage: 'Referenced record does not exist.',
        };
      case '23502':
        return {
          code: pgError.code, message: pgError.message, details: pgError.details, hint: pgError.hint,
          type: 'database', isRetryable: false,
          userMessage: 'Required field is missing.',
        };
      case '23514':
        return {
          code: pgError.code, message: pgError.message, details: pgError.details, hint: pgError.hint,
          type: 'database', isRetryable: false,
          userMessage: 'Data validation failed.',
        };
      case '08006':
      case '08001':
        return {
          code: pgError.code, message: pgError.message, details: pgError.details, hint: pgError.hint,
          type: 'database', isRetryable: true,
          userMessage: 'Database connection error. Please try again.',
        };
      case '57014':
        return {
          code: pgError.code, message: pgError.message, details: pgError.details, hint: pgError.hint,
          type: 'database', isRetryable: true,
          userMessage: 'Request timed out. Please try again.',
        };
      default:
        return {
          code: pgError.code, message: pgError.message, details: pgError.details, hint: pgError.hint,
          type: 'database', isRetryable: false,
          userMessage: 'Database error occurred. Please try again.',
        };
    }
  }

  if (error && typeof error === 'object' && 'statusCode' in error) {
    const storageError = error as { statusCode: number; message: string; error: string };

    switch (storageError.statusCode) {
      case 401:
        return { type: 'storage', message: storageError.message, isRetryable: false, userMessage: 'Storage authentication failed. Please log in again.' };
      case 403:
        return { type: 'storage', message: storageError.message, isRetryable: false, userMessage: 'You do not have permission to access this resource.' };
      case 413:
        return { type: 'storage', message: storageError.message, isRetryable: false, userMessage: 'File is too large. Please upload a smaller file.' };
      case 429:
        return { type: 'storage', message: storageError.message, isRetryable: true, userMessage: 'Too many requests. Please wait and try again.' };
      default:
        if (storageError.statusCode >= 500) {
          return { type: 'storage', message: storageError.message, isRetryable: true, userMessage: 'Storage service error. Please try again.' };
        }
        return { type: 'storage', message: storageError.message, isRetryable: false, userMessage: 'Storage error occurred.' };
    }
  }

  if (error && typeof error === 'object' && 'status' in error) {
    const authError = error as { status: number; message: string };

    switch (authError.status) {
      case 401:
        return { type: 'auth', message: authError.message, isRetryable: false, userMessage: 'Authentication failed. Please log in again.' };
      case 403:
        return { type: 'auth', message: authError.message, isRetryable: false, userMessage: 'You do not have permission to perform this action.' };
      case 429:
        return { type: 'auth', message: authError.message, isRetryable: true, userMessage: 'Too many authentication attempts. Please wait.' };
    }
  }

  if (error instanceof Error) {
    return { type: 'unknown', message: error.message, isRetryable: false, userMessage: 'An unexpected error occurred. Please try again.' };
  }

  return { type: 'unknown', message: 'Unknown error', isRetryable: false, userMessage: 'An unexpected error occurred. Please try again.' };
}

/**
 * Executes an async operation with automatic retry on retryable Supabase errors.
 * Uses exponential backoff: delay = delayMs × 2^attempt.
 *
 * Accepts both `Promise<T>` and thenable objects (e.g. PostgrestFilterBuilder) via `Thenable<T>`.
 *
 * @param operation - The async function to execute and potentially retry.
 * @param options - Retry configuration.
 * @param options.maxRetries - Maximum number of retries (default 3).
 * @param options.delayMs - Base delay in milliseconds (default 1000).
 * @param options.onRetry - Callback invoked before each retry with attempt number and error.
 * @returns The result of the operation.
 * @throws {SupabaseError} If all retries are exhausted or the error is non-retryable.
 */
export async function withRetry<T>(
  operation: () => (PromiseLike<T> | T),
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, onRetry } = options;
  let lastError: SupabaseError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = handleSupabaseError(error);

      if (!lastError.isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      const delay = delayMs * Math.pow(2, attempt);

      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('Unreachable: withRetry loop exited without result');
}

/**
 * Type guard that checks whether a value is a structured {@link SupabaseError}.
 *
 * @param error - The value to check.
 * @returns True if the value has the shape of a SupabaseError.
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'type' in error &&
    'userMessage' in error
  );
}
