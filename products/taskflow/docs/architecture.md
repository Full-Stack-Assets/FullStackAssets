# TaskFlow Architecture

## Product boundary

TaskFlow Runtime is the implemented orchestration engine. TaskFlow Studio is a planned client that may eventually author workflow definitions and display run evidence through the runtime HTTP API. Studio does not own orchestration truth.

```mermaid
flowchart LR
    Client[CLI / HTTP client / planned Studio] --> Handler[HTTP or direct runtime adapter]
    Handler --> Engine[TaskFlow Runtime]
    Engine --> Planner[Workflow plan]
    Engine --> Executor[Step executor + retries]
    Engine --> Verifier[Workflow verifier]
    Engine --> Store[(RunStore)]
    Executor --> Usage[Usage and cost ledger]
    Store --> Evidence[JSON run records]
```

## Execution sequence

```mermaid
sequenceDiagram
    participant C as Client
    participant E as Engine
    participant W as Workflow
    participant S as RunStore

    C->>E: runWorkflow(workflow, input)
    E->>W: plan(input)
    W-->>E: typed PlanStep[]
    E->>S: save planned record
    loop each step
        E->>W: executeStep(step, state, context)
        alt transient failure and attempts remain
            W-->>E: error
            E->>E: record failed attempt
            E->>W: retry executeStep
        else success
            W-->>E: next state
            E->>E: record step evidence
        end
    end
    E->>W: verify(input, final state)
    W-->>E: verification evidence + optional output
    E->>S: save terminal record
    E-->>C: succeeded or failed RunRecord
```

## Components

### `src/core/types.ts`

Defines the stable public contracts: plans, steps, events, run records, stores, verification, workflow context, and usage records.

### `src/core/engine.ts`

Owns the state transition from planned to running to succeeded/failed. It catches planning and execution errors, records evidence, and persists terminal state.

### `src/core/retry.ts`

Executes an asynchronous operation up to a positive integer attempt limit. It exposes each failure to the engine and throws `RetryExhaustedError` after the final attempt.

### `src/core/persistence.ts`

Stores one JSON file per run using write-to-temporary-file followed by atomic rename. Run IDs are restricted to safe filename characters.

### `src/core/metrics.ts`

Calculates nearest-rank percentiles, expected-outcome accuracy, valid-case completion, and total recorded cost.

### `src/workflows/client-intake.ts`

Implements the domain-specific consulting intake workflow. It does not manage files, global metrics, HTTP, or retry loops.

### HTTP adapters

`src/http/handler.ts` uses the Web `Request`/`Response` interface. `src/server.ts` adapts Node HTTP. `api/run.ts` provides a serverless-compatible `POST` export.

## Run record invariants

- Every run has one stable `runId`, `workflowId`, input snapshot, and ordered event sequence.
- A succeeded run has successful verification.
- A failed run contains an error or failed verification evidence.
- Adapter cost is the sum of explicitly recorded usage entries; unknown cost is never guessed.
- Persistence failures are surfaced rather than silently ignored.
