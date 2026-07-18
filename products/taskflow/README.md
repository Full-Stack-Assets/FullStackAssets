# TaskFlow Runtime

TaskFlow Runtime is an evidence-backed workflow engine that separates every run into **Plan → Execute → Verify**. It records retries, verification evidence, usage, cost, and terminal status in a human-readable JSON run record.

**Product naming is intentionally explicit:**

- **TaskFlow Runtime** — implemented in this package.
- **TaskFlow Studio** — planned visual authoring and observability client. It is not presented as implemented.

This package is maintained at `products/taskflow/` inside the private `Full-Stack-Assets/FullStackAssets` monorepo and is structured so it can later be extracted into a standalone repository.

## Current evidence

| Evidence | Result | Scope |
|---|---:|---|
| Automated tests | 23 passing at initial publication | Runtime, retries, persistence, workflow, metrics, HTTP |
| Demo run | Verified success with one injected retry | Synthetic consulting intake |
| Local benchmark | 200 runs, 100% expected-outcome match | 8 synthetic cases × 25 iterations |
| Valid-case completion | 100% | Local deterministic workflow only |
| Local latency | p50 0.040 ms; p95 0.136 ms | In-process Node.js 22 benchmark |
| Recorded adapter cost | $0.00 | No paid model or connector is used |

These are **local synthetic benchmark results, not production customer metrics**. See [Measurement methodology](docs/metrics.md).

## Quick start

Requirements: Node.js 22 or later.

```bash
npm ci
npm run check
```

Generate the checked demonstration workflow:

```bash
npm run demo
cat demo/runs/2026-07-18-client-intake.json
```

Run a new local benchmark:

```bash
npm run benchmark
cat benchmarks/results/2026-07-18-local.json
```

Start the HTTP service:

```bash
npm start
curl http://localhost:3000/health
```

Run a consulting intake:

```bash
curl -X POST http://localhost:3000/v1/runs/client-intake \
  -H 'content-type: application/json' \
  --data @demo/input/client-intake.json
```

## Runtime contract

A workflow supplies four responsibilities:

```ts
interface Workflow<Input, State, Output> {
  id: string;
  plan(input: Input): Promise<Plan>;
  initialState?(input: Input): Promise<State> | State;
  executeStep(step: PlanStep, state: State, context: RuntimeContext): Promise<State>;
  verify(input: Input, state: State): Promise<VerificationResult<Output>>;
}
```

The engine owns sequencing, retries, event logging, cost aggregation, terminal status, and persistence. Workflow implementations own only domain behavior.

## Included workflow

`consulting-client-intake` converts structured consulting intake into:

- normalized contact and business data
- a budget-based opportunity tier
- qualification rationale
- a concise consulting brief
- a recommended next action

The demonstration deliberately fails the qualification step once, then succeeds on retry. The checked run record contains the full evidence trail.

## Documentation

- [Architecture](docs/architecture.md)
- [Threat model](docs/threat-model.md)
- [Deployment guide](docs/deployment.md)
- [Dependency inventory](docs/dependencies.md)
- [Measurement methodology](docs/metrics.md)
- [Security policy](SECURITY.md)

## Commercial status

TaskFlow is **pre-revenue**. Pricing of `$39 / $99 / $249`, a visual workflow canvas, SaaS billing, managed connectors, multi-tenant storage, and a `1–2 hours/week` operating target are product targets—not measured current capabilities.

## License and IP

No open-source license is granted by this private repository. Third-party development dependencies retain their own licenses as listed in [Dependency inventory](docs/dependencies.md).
