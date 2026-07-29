import test from 'node:test';
import assert from 'node:assert/strict';
import type {
  Plan,
  PlanStep,
  RunRecord,
  RunStore,
  RuntimeDependencies,
  VerificationResult,
  Workflow,
} from '../src/index.js';

test('public runtime contracts compose into a workflow definition', () => {
  type Input = { value: string };
  type State = { normalized?: string };
  type Output = { normalized: string };

  const step: PlanStep = { id: 'normalize', label: 'Normalize input', maxAttempts: 1 };
  const plan: Plan = { steps: [step] };
  const verification: VerificationResult<Output> = {
    verified: true,
    evidence: ['normalized output exists'],
    output: { normalized: 'hello' },
  };

  const workflow: Workflow<Input, State, Output> = {
    id: 'contract-test',
    plan: async () => plan,
    executeStep: async (_step, state) => ({ ...state, normalized: 'hello' }),
    verify: async () => verification,
  };

  const store: RunStore = {
    async save<T>(_record: RunRecord<T>): Promise<void> {
      return undefined;
    },
    async load<T = unknown>(): Promise<RunRecord<T> | null> {
      return null;
    },
  };
  const dependencies: RuntimeDependencies = { store };

  assert.equal(workflow.id, 'contract-test');
  assert.equal(dependencies.store, store);
});
