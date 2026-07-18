export type RunStatus = 'planned' | 'running' | 'succeeded' | 'failed';
export type RunPhase = 'plan' | 'execute' | 'verify' | 'persist';

export interface PlanStep {
  id: string;
  label: string;
  maxAttempts: number;
}

export interface Plan {
  steps: PlanStep[];
}

export interface VerificationResult<Output> {
  verified: boolean;
  evidence: string[];
  output?: Output;
}

export interface UsageRecord {
  provider: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd: number;
}

export interface RunEvent {
  sequence: number;
  at: string;
  phase: RunPhase;
  type: string;
  message: string;
  stepId?: string;
  attempt?: number;
  durationMs?: number;
  error?: string;
}

export interface RunRecord<Output = unknown> {
  schemaVersion: 1;
  runId: string;
  workflowId: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  input: unknown;
  plan?: Plan;
  output?: Output;
  verification?: VerificationResult<Output>;
  events: RunEvent[];
  usage: UsageRecord[];
  totalCostUsd: number;
  error?: string;
}

export interface RunStore {
  save<Output>(record: RunRecord<Output>): Promise<void>;
  load<Output = unknown>(runId: string): Promise<RunRecord<Output> | null>;
}

export interface RuntimeClock {
  now(): Date;
}

export interface RuntimeContext {
  readonly runId: string;
  readonly workflowId: string;
  readonly attempt: number;
  readonly stepId: string;
  recordUsage(usage: UsageRecord): void;
}

export interface Workflow<Input, State, Output> {
  readonly id: string;
  plan(input: Input): Promise<Plan>;
  initialState?(input: Input): Promise<State> | State;
  executeStep(step: PlanStep, state: State, context: RuntimeContext): Promise<State>;
  verify(input: Input, state: State): Promise<VerificationResult<Output>>;
}

export interface RuntimeDependencies {
  store: RunStore;
  clock?: RuntimeClock;
  idFactory?: () => string;
}
