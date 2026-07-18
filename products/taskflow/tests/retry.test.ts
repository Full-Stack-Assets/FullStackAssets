import test from 'node:test';
import assert from 'node:assert/strict';
import { executeWithRetry, RetryExhaustedError } from '../src/index.js';

test('executeWithRetry returns after a transient failure', async () => {
  let attempts = 0;
  const failures: number[] = [];

  const result = await executeWithRetry(
    async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('temporary');
      return 'ok';
    },
    {
      maxAttempts: 3,
      onAttemptFailure: ({ attempt }) => {
        failures.push(attempt);
      },
    },
  );

  assert.deepEqual(result, { value: 'ok', attempts: 2 });
  assert.deepEqual(failures, [1]);
});

test('executeWithRetry throws structured error after exhausting attempts', async () => {
  await assert.rejects(
    executeWithRetry(async () => {
      throw new Error('still failing');
    }, { maxAttempts: 2 }),
    (error: unknown) => {
      assert.ok(error instanceof RetryExhaustedError);
      assert.equal(error.attempts, 2);
      assert.match(error.message, /still failing/);
      return true;
    },
  );
});
