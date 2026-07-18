import type {
  Plan,
  PlanStep,
  RuntimeContext,
  VerificationResult,
  Workflow,
} from '../core/types.js';

export type OpportunityTier = 'starter' | 'growth' | 'transformation';

export interface ClientIntakeInput {
  businessName: string;
  contactName: string;
  email: string;
  requestedService: string;
  budgetUsd: number;
  timeline: string;
  goals: string[];
}

export interface NormalizedClientIntake {
  businessName: string;
  contactName: string;
  email: string;
  requestedService: string;
  budgetUsd: number;
  timeline: string;
  goals: string[];
}

export interface OpportunityQualification {
  tier: OpportunityTier;
  rationale: string;
}

export interface ConsultingBrief {
  summary: string;
  goals: string[];
  timeline: string;
  recommendedScope: string;
  nextAction: string;
}

export interface ClientIntakeOutput {
  normalized: NormalizedClientIntake;
  qualification: OpportunityQualification;
  brief: ConsultingBrief;
}

export interface ClientIntakeState {
  source?: ClientIntakeInput;
  normalized?: NormalizedClientIntake;
  qualification?: OpportunityQualification;
  brief?: ConsultingBrief;
}

export interface ClientIntakeWorkflowOptions {
  failStepOnce?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function compact(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function validateInput(input: ClientIntakeInput): void {
  const required: Array<[string, string]> = [
    ['business name', input.businessName],
    ['contact name', input.contactName],
    ['requested service', input.requestedService],
    ['timeline', input.timeline],
  ];

  for (const [label, value] of required) {
    if (compact(value).length === 0) throw new Error(`A ${label} is required.`);
  }
  if (!EMAIL_PATTERN.test(compact(input.email).toLowerCase())) {
    throw new Error('A valid contact email is required.');
  }
  if (!Number.isFinite(input.budgetUsd) || input.budgetUsd < 0) {
    throw new Error('Budget must be a non-negative number.');
  }
  if (input.goals.length === 0 || input.goals.some((goal) => compact(goal).length === 0)) {
    throw new Error('At least one non-empty business goal is required.');
  }
}

export function classifyOpportunity(budgetUsd: number): OpportunityTier {
  if (budgetUsd < 5_000) return 'starter';
  if (budgetUsd < 10_000) return 'growth';
  return 'transformation';
}

function qualificationFor(input: NormalizedClientIntake): OpportunityQualification {
  const tier = classifyOpportunity(input.budgetUsd);
  const rationaleByTier: Record<OpportunityTier, string> = {
    starter: 'The budget supports a tightly scoped implementation or advisory sprint.',
    growth: 'The budget supports a multi-step automation implementation with onboarding.',
    transformation: 'The budget supports discovery, implementation, integration, and measured rollout.',
  };
  return { tier, rationale: rationaleByTier[tier] };
}

function briefFor(
  input: NormalizedClientIntake,
  qualification: OpportunityQualification,
): ConsultingBrief {
  const nextAction = qualification.tier === 'starter'
    ? 'Send a scoped fixed-price recommendation and confirm the decision maker.'
    : 'Schedule a 45-minute discovery session with the decision maker and process owner.';

  return {
    summary: `${input.businessName} is seeking ${input.requestedService} to achieve ${input.goals.join('; ')}.`,
    goals: [...input.goals],
    timeline: input.timeline,
    recommendedScope: `${qualification.tier} engagement: ${qualification.rationale}`,
    nextAction,
  };
}

function requireNormalized(state: ClientIntakeState): NormalizedClientIntake {
  if (!state.normalized) throw new Error('Normalized intake is required before this step.');
  return state.normalized;
}

export function createClientIntakeWorkflow(
  options: ClientIntakeWorkflowOptions = {},
): Workflow<ClientIntakeInput, ClientIntakeState, ClientIntakeOutput> {
  const injectedFailures = new Set<string>();

  return {
    id: 'consulting-client-intake',

    async plan(input): Promise<Plan> {
      validateInput(input);
      return {
        steps: [
          { id: 'normalize-intake', label: 'Normalize client intake', maxAttempts: 1 },
          { id: 'qualify-opportunity', label: 'Qualify opportunity', maxAttempts: 2 },
          { id: 'draft-consulting-brief', label: 'Draft consulting brief', maxAttempts: 1 },
        ],
      };
    },

    initialState(input): ClientIntakeState {
      return { source: structuredClone(input) };
    },

    async executeStep(
      step: PlanStep,
      state: ClientIntakeState,
      context: RuntimeContext,
    ): Promise<ClientIntakeState> {
      const failureKey = `${context.runId}:${step.id}`;
      if (options.failStepOnce === step.id && !injectedFailures.has(failureKey)) {
        injectedFailures.add(failureKey);
        throw new Error(`Injected transient failure for ${step.id}`);
      }

      context.recordUsage({
        provider: 'taskflow-local',
        model: 'deterministic',
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
      });

      switch (step.id) {
        case 'normalize-intake': {
          if (!state.source) throw new Error('Source intake is missing.');
          return {
            ...state,
            normalized: {
              businessName: compact(state.source.businessName),
              contactName: compact(state.source.contactName),
              email: compact(state.source.email).toLowerCase(),
              requestedService: compact(state.source.requestedService),
              budgetUsd: state.source.budgetUsd,
              timeline: compact(state.source.timeline),
              goals: state.source.goals.map(compact),
            },
          };
        }
        case 'qualify-opportunity': {
          const normalized = requireNormalized(state);
          return { ...state, qualification: qualificationFor(normalized) };
        }
        case 'draft-consulting-brief': {
          const normalized = requireNormalized(state);
          if (!state.qualification) {
            throw new Error('Opportunity qualification is required before drafting the brief.');
          }
          return {
            ...state,
            brief: briefFor(normalized, state.qualification),
          };
        }
        default:
          throw new Error(`Unknown client-intake step: ${step.id}`);
      }
    },

    async verify(input, state): Promise<VerificationResult<ClientIntakeOutput>> {
      const evidence: string[] = [];
      const normalized = state.normalized;
      const qualification = state.qualification;
      const brief = state.brief;

      if (!normalized) evidence.push('Normalized intake is missing.');
      if (!qualification) evidence.push('Opportunity qualification is missing.');
      if (!brief) evidence.push('Consulting brief is missing.');

      if (normalized && normalized.email !== compact(input.email).toLowerCase()) {
        evidence.push('Normalized email does not match the submitted email.');
      }
      if (normalized && qualification && qualification.tier !== classifyOpportunity(normalized.budgetUsd)) {
        evidence.push('Qualification tier does not match budget.');
      }
      if (normalized && brief) {
        if (!brief.summary.includes(normalized.businessName)) {
          evidence.push('Brief summary does not include the business name.');
        }
        if (!brief.summary.includes(normalized.requestedService)) {
          evidence.push('Brief summary does not include the requested service.');
        }
        if (JSON.stringify(brief.goals) !== JSON.stringify(normalized.goals)) {
          evidence.push('Brief goals do not preserve the normalized goals.');
        }
        if (brief.timeline !== normalized.timeline) {
          evidence.push('Brief timeline does not match the normalized timeline.');
        }
        if (brief.nextAction.trim().length === 0) {
          evidence.push('Brief next action is empty.');
        }
      }

      if (evidence.length > 0 || !normalized || !qualification || !brief) {
        return { verified: false, evidence };
      }

      return {
        verified: true,
        evidence: [
          'All required intake fields were normalized.',
          'The qualification tier matches the submitted budget.',
          'The consulting brief preserves the requested service, goals, and timeline.',
        ],
        output: {
          normalized: structuredClone(normalized),
          qualification: structuredClone(qualification),
          brief: structuredClone(brief),
        },
      };
    },
  };
}
