/**
 * Standardized Result type for robust error handling
 * Replaces throwing exceptions in service layer
 * 
 * Usage:
 *   const result = await getReceipts(userId);
 *   if (!result.ok) {
 *     // handle error via result.error
 *     return;
 *   }
 *   // result.value is fully typed
 */

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Create a successful Result
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create an error Result
 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Wrap a promise-returning function to convert exceptions to Result
 */
export async function tryCatch<T, E = Error>(
  fn: () => Promise<T>,
  mapError?: (e: unknown) => E
): Promise<Result<T, E>> {
  try {
    return ok(await fn());
  } catch (e) {
    return err(mapError ? mapError(e) : (e as E));
  }
}

/**
 * Wrap a synchronous function to convert exceptions to Result
 */
export function tryCatchSync<T, E = Error>(
  fn: () => T,
  mapError?: (e: unknown) => E
): Result<T, E> {
  try {
    return ok(fn());
  } catch (e) {
    return err(mapError ? mapError(e) : (e as E));
  }
}

/**
 * Chain a Result-returning function (flatMap)
 * Useful for sequential operations that can fail
 */
export async function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> {
  if (!result.ok) return result;
  return fn(result.value);
}

/**
 * Map the success value of a Result
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (!result.ok) return result;
  return ok(fn(result.value));
}

/**
 * Map the error of a Result
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (result.ok) return result;
  return err(fn(result.error));
}

/**
 * Get the value or throw (for cases where you know it's ok)
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (!result.ok) throw result.error;
  return result.value;
}

/**
 * Get the value or return a default
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

/**
 * Combine multiple Results (all must succeed)
 */
export async function all<T extends readonly Result<unknown, Error>[]>(
  results: T
): Promise<Result<{ [K in keyof T]: T[K] extends Result<infer V, Error> ? V : never }, Error>> {
  const values = await Promise.all(
    results.map(async (r) => {
      if (!r.ok) throw r.error;
      return r.value;
    })
  );
  return ok(values as { [K in keyof T]: T[K] extends Result<infer V, Error> ? V : never });
}

/**
 * Type guard to check if Result is successful
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/**
 * Type guard to check if Result is an error
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}