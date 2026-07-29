import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runWorkflow,
  type RunRecord,
  type RunStore,
  type Workflow,
} from '../src/index.js';

class MemoryStore implements RunStore {
  readonly saves: RunRecord[] = [];

  async save<T>(record: RunRecord<T>): Promise<void> {
    this.saves.push(structuredClone(record) as RunRecord);
  }

  async load<T = unknown>(runId: string): Promise<RunRecord<T> | null> {
    const record = [...this.saves].reverse().find((item) => item.runId === runId);
    return (record ? structuredClone(record) : null) as RunRecord<T> | null;
  }
}

function fixedClock(...timestamps: string[]) {
  let index = 0;
  return {
    now(): Date {
      const value = timestamps[Math.min(index, timestamps.length - 1)];
      index += 1;
      if (!value) throw new Error('clock exhausted');
      return new Date(value);
    },
  };
}

test('runWorkflow executes plan, steps, and verification in order', async () => {
  const calls: string[] = [];
  const store = new MemoryStore();
  const workflow: Workflow<{ value: string }, { value: string }, { result: string }> = {
    id: 'ordered',
    async plan() {
      calls.push('plan');
      return {
        steps: [
          { id: 'first', label: 'First', maxAttempts: 1 },
          { id: 'second', label: 'Second', maxAttempts: 1 },
        ],
      };
    },
    initialState: (input) => ({ value: input.value }),
    async executeStep(step, state) {
      calls.push(`execute:${step.id}`);
      return { value: `${state.value}:${step.id}` };
    },
    async verify(_input, state) {
      calls.push('verify');
      return {
        verified: true,
        evidence: ['all steps completed'],
        output: { result: state.value },
      };
    },
  };

  const record = await runWorkflow(
    workflow,
    { value: 'start' },
    {
      store,
      idFactory: () => 'run-ordered',
      clock: fixedClock(
        '2026-07-18T12:00:00.000Z',
        '2026-07-18T12:00:00.010Z',
        '2026-07-18T12:00:00.020Z',
        '2026-07-18T12:00:00.030Z',
        '2026-07-18T12:00:00.040Z',
        '2026-07-18T12:00:00.050Z',
        '2026-07-18T12:00:00.060Z',
        '2026-07-18T12:00:00.070Z',
      ),
    },
  );

  assert.deepEqual(calls, ['plan', 'execute:first', 'execute:second', 'verify']);
  assert.equal(record.status, 'succeeded');
  assert.deepEqual(record.output, { result: 'start:first:second' });
  assert.equal(record.runId, 'run-ordered');
  assert.ok(store.saves.length >= 2);
  assert.equal(store.saves.at(-1)?.status, 'succeeded');
  assert.deepEqual(
    record.events.filter((event) => event.type === 'step_succeeded').map((event) => event.stepId),
    ['first', 'second'],
  );
});

test('runWorkflow marks a run failed when verification rejects the result', async () => {
  const store = new MemoryStore();
  const workflow: Workflow<string, string, string> = {
    id: 'verification-failure',
    async plan() {
      return { steps: [{ id: 'copy', label: 'Copy', maxAttempts: 1 }] };
    },
    initialState: (input) => input,
    async executeStep(_step, state) {
      return state;
    },
    async verify() {
      return { verified: false, evidence: ['required output missing'] };
    },
  };

  const record = await runWorkflow(workflow, 'input', {
    store,
    idFactory: () => 'run-failed',
  });

  assert.equal(record.status, 'failed');
  assert.equal(record.output, undefined);
  assert.deepEqual(record.verification?.evidence, ['required output missing']);
  assert.match(record.error ?? '', /verification failed/i);
});

test('runWorkflow records retry attempts and fails after exhaustion', async () => {
  const store = new MemoryStore();
  let attempts = 0;
  const workflow: Workflow<null, Record<string, never>, never> = {
    id: 'retry-failure',
    async plan() {
      return { steps: [{ id: 'unstable', label: 'Unstable', maxAttempts: 2 }] };
    },
    initialState: () => ({}),
    async executeStep() {
      attempts += 1;
      throw new Error('connector unavailable');
    },
    async verify() {
      throw new Error('verify should not run');
    },
  };

  const record = await runWorkflow(workflow, null, {
    store,
    idFactory: () => 'run-retry-failure',
  });

  assert.equal(attempts, 2);
  assert.equal(record.status, 'failed');
  assert.equal(record.events.filter((event) => event.type === 'step_attempt_failed').length, 2);
  assert.match(record.error ?? '', /connector unavailable/);
});
