export interface RetryFailure {
  attempt: number;
  maxAttempts: number;
  error: Error;
}

export interface RetryOptions {
  maxAttempts: number;
  onAttemptFailure?: (failure: RetryFailure) => void | Promise<void>;
}

export interface RetryResult<T> {
  value: T;
  attempts: number;
}

export class RetryExhaustedError extends Error {
  readonly attempts: number;
  readonly cause: Error;

  constructor(attempts: number, cause: Error) {
    super(`Operation failed after ${attempts} attempt(s): ${cause.message}`, { cause });
    this.name = 'RetryExhaustedError';
    this.attempts = attempts;
    this.cause = cause;
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export async function executeWithRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<RetryResult<T>> {
  if (!Number.isInteger(options.maxAttempts) || options.maxAttempts < 1) {
    throw new RangeError('maxAttempts must be a positive integer');
  }

  let lastError = new Error('operation did not run');
  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try {
      return { value: await operation(attempt), attempts: attempt };
    } catch (error) {
      lastError = toError(error);
      await options.onAttemptFailure?.({ attempt, maxAttempts: options.maxAttempts, error: lastError });
    }
  }

  throw new RetryExhaustedError(options.maxAttempts, lastError);
}
