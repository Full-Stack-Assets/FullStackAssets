export interface BenchmarkSample {
  caseId: string;
  expectedVerified: boolean;
  actualVerified: boolean;
  latencyMs: number;
  costUsd: number;
}

export interface BenchmarkMetrics {
  sampleSize: number;
  verificationAccuracy: number;
  taskCompletionRate: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  totalCostUsd: number;
}

function round(value: number, digits = 6): number {
  return Number(value.toFixed(digits));
}

export function percentile(values: number[], fraction: number): number {
  if (values.length === 0) return 0;
  if (!Number.isFinite(fraction) || fraction <= 0 || fraction > 1) {
    throw new RangeError('percentile fraction must be greater than 0 and at most 1');
  }
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(fraction * sorted.length) - 1);
  return sorted[index] ?? 0;
}

export function calculateBenchmarkMetrics(samples: BenchmarkSample[]): BenchmarkMetrics {
  const expectedSuccesses = samples.filter((sample) => sample.expectedVerified);
  const outcomeMatches = samples.filter(
    (sample) => sample.expectedVerified === sample.actualVerified,
  ).length;
  const completedExpectedSuccesses = expectedSuccesses.filter(
    (sample) => sample.actualVerified,
  ).length;
  const latencies = samples.map((sample) => sample.latencyMs);

  return {
    sampleSize: samples.length,
    verificationAccuracy: samples.length === 0 ? 0 : round(outcomeMatches / samples.length),
    taskCompletionRate: expectedSuccesses.length === 0
      ? 0
      : round(completedExpectedSuccesses / expectedSuccesses.length),
    p50LatencyMs: round(percentile(latencies, 0.5), 3),
    p95LatencyMs: round(percentile(latencies, 0.95), 3),
    totalCostUsd: round(samples.reduce((sum, sample) => sum + sample.costUsd, 0)),
  };
}
