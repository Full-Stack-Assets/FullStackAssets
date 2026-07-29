import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBenchmarkMetrics, percentile } from '../src/index.js';

test('percentile calculates nearest-rank p50 and p95', () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.equal(percentile(values, 0.5), 5);
  assert.equal(percentile(values, 0.95), 10);
});

test('calculateBenchmarkMetrics reports outcome accuracy and completion', () => {
  const metrics = calculateBenchmarkMetrics([
    { caseId: 'a', expectedVerified: true, actualVerified: true, latencyMs: 4, costUsd: 0 },
    { caseId: 'b', expectedVerified: true, actualVerified: false, latencyMs: 8, costUsd: 0.01 },
    { caseId: 'c', expectedVerified: false, actualVerified: false, latencyMs: 12, costUsd: 0 },
    { caseId: 'd', expectedVerified: false, actualVerified: true, latencyMs: 16, costUsd: 0.02 },
  ]);

  assert.equal(metrics.sampleSize, 4);
  assert.equal(metrics.verificationAccuracy, 0.5);
  assert.equal(metrics.taskCompletionRate, 0.5);
  assert.equal(metrics.p50LatencyMs, 8);
  assert.equal(metrics.p95LatencyMs, 16);
  assert.equal(metrics.totalCostUsd, 0.03);
});
