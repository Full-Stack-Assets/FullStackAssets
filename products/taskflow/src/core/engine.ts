import { randomUUID } from 'node:crypto';
import { executeWithRetry } from './retry.js';
import type {
  RunEvent,
  RunRecord,
  RuntimeClock,
  RuntimeDependencies,
  UsageRecord,
  Workflow,
} from './types.js';

const systemClock: RuntimeClock = { now: () => new Date() };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function elapsedMs(start: Date, end: Date): number {
  return Math.max(0, end.getTime() - start.getTime());
}

export async function runWorkflow<Input, State, Output>(
  workflow: Workflow<Input, State, Output>,
  input: Input,
  dependencies: RuntimeDependencies,
): Promise<RunRecord<Output>> {
  const clock = dependencies.clock ?? systemClock;
  const runId = dependencies.idFactory?.() ?? randomUUID();
  const started = clock.now();
  const usage: UsageRecord[] = [];
  const record: RunRecord<Output> = {
    schemaVersion: 1,
    runId,
    workflowId: workflow.id,
    status: 'planned',
    startedAt: started.toISOString(),
    input: structuredClone(input),
    events: [],
    usage,
    totalCostUsd: 0,
  };

  const addEvent = (event: Omit<RunEvent, 'sequence' | 'at'>): void => {
    record.events.push({
      sequence: record.events.length + 1,
      at: clock.now().toISOString(),
      ...event,
    });
  };

  const finalize = async (status: 'succeeded' | 'failed', error?: string): Promise<RunRecord<Output>> => {
    const completed = clock.now();
    record.status = status;
    record.completedAt = completed.toISOString();
    record.durationMs = elapsedMs(started, completed);
    record.totalCostUsd = Number(usage.reduce((sum, item) => sum + item.costUsd, 0).toFixed(6));
    if (error !== undefined) record.error = error;
    await dependencies.store.save(record);
    return record;
  };

  try {
    const phaseStarted = clock.now();
    const plan = await workflow.plan(input);
    record.plan = plan;
    addEvent({
      phase: 'plan',
      type: 'plan_succeeded',
      message: `Planned ${plan.steps.length} step(s).`,
      durationMs: elapsedMs(phaseStarted, clock.now()),
    });
    await dependencies.store.save(record);

    record.status = 'running';
    let state = workflow.initialState
      ? await workflow.initialState(input)
      : ({} as State);

    for (const step of plan.steps) {
      const stepStarted = clock.now();
      addEvent({
        phase: 'execute',
        type: 'step_started',
        message: step.label,
        stepId: step.id,
      });

      const result = await executeWithRetry(
        async (attempt) => workflow.executeStep(step, state, {
          runId,
          workflowId: workflow.id,
          attempt,
          stepId: step.id,
          recordUsage(item) {
            usage.push(structuredClone(item));
          },
        }),
        {
          maxAttempts: step.maxAttempts,
          onAttemptFailure: ({ attempt, error }) => {
            addEvent({
              phase: 'execute',
              type: 'step_attempt_failed',
              message: `Attempt ${attempt} failed for ${step.label}.`,
              stepId: step.id,
              attempt,
              error: error.message,
            });
          },
        },
      );

      state = result.value;
      addEvent({
        phase: 'execute',
        type: 'step_succeeded',
        message: `${step.label} completed.`,
        stepId: step.id,
        attempt: result.attempts,
        durationMs: elapsedMs(stepStarted, clock.now()),
      });
    }

    const verifyStarted = clock.now();
    const verification = await workflow.verify(input, state);
    record.verification = verification;
    addEvent({
      phase: 'verify',
      type: verification.verified ? 'verification_succeeded' : 'verification_failed',
      message: verification.evidence.join(' '),
      durationMs: elapsedMs(verifyStarted, clock.now()),
    });

    if (!verification.verified) {
      return finalize('failed', `Verification failed: ${verification.evidence.join('; ')}`);
    }
    if (verification.output !== undefined) record.output = verification.output;
    return finalize('succeeded');
  } catch (error) {
    const message = errorMessage(error);
    addEvent({
      phase: record.plan ? 'execute' : 'plan',
      type: record.plan ? 'run_failed' : 'plan_failed',
      message,
      error: message,
    });
    return finalize('failed', message);
  }
}
