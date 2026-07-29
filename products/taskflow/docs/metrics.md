# Measurement Methodology

## Evidence artifacts

- Dataset: `benchmarks/cases.json`
- Benchmark runner: `scripts/run-benchmark.ts`
- Checked report: `benchmarks/results/2026-07-18-local.json`
- Demonstration input: `demo/input/client-intake.json`
- Demonstration run: `demo/runs/2026-07-18-client-intake.json`

## Definitions

### Verification accuracy

The fraction of benchmark runs where the runtime's verified outcome matches the case's checked expected outcome. Invalid inputs are expected to fail planning and count as correct when the final outcome is unverified.

### Task-completion rate

The fraction of expected-success runs that finish with terminal status `succeeded` and `verification.verified = true`.

### Latency

Wall-clock time measured around the in-process `runWorkflow` call using Node's monotonic performance clock. The report uses nearest-rank p50 and p95 percentiles.

### Cost

The sum of `costUsd` values explicitly recorded by workflow adapters. The included deterministic workflow uses no paid model or connector and therefore records `$0.00`. This is not an estimate of future hosted infrastructure or model cost.

## Initial local result

Environment: Node.js v22.16.0, Linux x64. Dataset: 8 synthetic cases repeated 25 times, producing 200 samples.

| Metric | Result |
|---|---:|
| Verification accuracy | 100% |
| Task-completion rate | 100% |
| p50 latency | 0.040 ms |
| p95 latency | 0.136 ms |
| Recorded adapter cost | $0.00 |

## Limitations

- The data is synthetic and contains no production customer traffic.
- The workflow is deterministic and local; networked tools will add failure modes and latency.
- The dataset is intentionally small and tests known validation boundaries.
- Accuracy does not establish general model quality because no probabilistic model is used.
- Hosted infrastructure, storage, support, and future connector costs are not included.

Run a fresh check:

```bash
npm run benchmark:fresh
```
