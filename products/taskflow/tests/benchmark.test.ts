import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runBenchmark } from '../scripts/run-benchmark.js';

test('local benchmark matches all expected outcomes at zero adapter cost', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'taskflow-benchmark-'));
  try {
    const report = await runBenchmark({
      outputPath: join(directory, 'result.json'),
      iterations: 2,
    });

    assert.equal(report.datasetCases, 8);
    assert.equal(report.iterations, 2);
    assert.equal(report.metrics.sampleSize, 16);
    assert.equal(report.metrics.verificationAccuracy, 1);
    assert.equal(report.metrics.taskCompletionRate, 1);
    assert.equal(report.metrics.totalCostUsd, 0);
    assert.ok(report.metrics.p95LatencyMs < 1000);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
