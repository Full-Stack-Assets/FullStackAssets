import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createClientIntakeWorkflow,
  runWorkflow,
  type ClientIntakeInput,
  type RunRecord,
  type RunStore,
} from '../src/index.js';

class MemoryStore implements RunStore {
  records: RunRecord[] = [];
  async save<T>(record: RunRecord<T>): Promise<void> {
    this.records.push(structuredClone(record) as RunRecord);
  }
  async load<T = unknown>(runId: string): Promise<RunRecord<T> | null> {
    const record = [...this.records].reverse().find((item) => item.runId === runId);
    return (record ?? null) as RunRecord<T> | null;
  }
}

const validInput: ClientIntakeInput = {
  businessName: ' Harbor Electric ',
  contactName: ' Alex Rivera ',
  email: ' ALEX@HARBOR-ELECTRIC.EXAMPLE ',
  requestedService: 'AI lead follow-up automation',
  budgetUsd: 12000,
  timeline: 'Launch within 8 weeks',
  goals: ['Respond to leads in under five minutes', 'Reduce manual CRM updates'],
};

test('client intake workflow plans three explicit phases', async () => {
  const workflow = createClientIntakeWorkflow();
  const plan = await workflow.plan(validInput);

  assert.deepEqual(
    plan.steps.map((step) => [step.id, step.maxAttempts]),
    [
      ['normalize-intake', 1],
      ['qualify-opportunity', 2],
      ['draft-consulting-brief', 1],
    ],
  );
});

test('client intake workflow rejects invalid email during planning', async () => {
  const workflow = createClientIntakeWorkflow();
  await assert.rejects(
    workflow.plan({ ...validInput, email: 'not-an-email' }),
    /valid contact email/i,
  );
});

test('client intake workflow produces a verified consulting brief', async () => {
  const store = new MemoryStore();
  const record = await runWorkflow(createClientIntakeWorkflow(), validInput, {
    store,
    idFactory: () => 'client-intake-success',
  });

  assert.equal(record.status, 'succeeded');
  assert.equal(record.output?.normalized.email, 'alex@harbor-electric.example');
  assert.equal(record.output?.qualification.tier, 'transformation');
  assert.match(record.output?.brief.summary ?? '', /Harbor Electric/);
  assert.deepEqual(record.output?.brief.goals, validInput.goals);
  assert.match(record.output?.brief.nextAction ?? '', /discovery/i);
  assert.equal(record.verification?.verified, true);
  assert.equal(record.totalCostUsd, 0);
});

test('client intake workflow retries one injected transient failure', async () => {
  const store = new MemoryStore();
  const record = await runWorkflow(
    createClientIntakeWorkflow({ failStepOnce: 'qualify-opportunity' }),
    validInput,
    { store, idFactory: () => 'client-intake-retry' },
  );

  assert.equal(record.status, 'succeeded');
  const failures = record.events.filter((event) => event.type === 'step_attempt_failed');
  assert.equal(failures.length, 1);
  assert.equal(failures[0]?.stepId, 'qualify-opportunity');
  assert.equal(failures[0]?.attempt, 1);
});

test('client intake verification rejects a tampered qualification tier', async () => {
  const workflow = createClientIntakeWorkflow();
  const state = await workflow.initialState?.(validInput);
  assert.ok(state);

  let current = state;
  for (const step of (await workflow.plan(validInput)).steps) {
    current = await workflow.executeStep(step, current, {
      runId: 'tamper-test',
      workflowId: workflow.id,
      attempt: 1,
      stepId: step.id,
      recordUsage: () => undefined,
    });
  }

  assert.ok(current.qualification);
  current.qualification.tier = 'starter';
  const verification = await workflow.verify(validInput, current);

  assert.equal(verification.verified, false);
  assert.match(verification.evidence.join(' '), /tier does not match budget/i);
});
