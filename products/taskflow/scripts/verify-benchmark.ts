import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { BenchmarkReport } from './run-benchmark.js';

const reportPath = resolve(process.argv[2] ?? 'benchmarks/results/2026-07-18-local.json');
const report = JSON.parse(await readFile(reportPath, 'utf8')) as BenchmarkReport;

assert.equal(report.metrics.sampleSize, report.datasetCases * report.iterations);
assert.equal(report.metrics.verificationAccuracy, 1);
assert.equal(report.metrics.taskCompletionRate, 1);
assert.equal(report.metrics.totalCostUsd, 0);
assert.ok(report.metrics.p95LatencyMs < 1000, 'p95 latency must stay below 1000 ms locally');
assert.ok(report.limitations.some((item) => /synthetic/i.test(item)));
assert.ok(report.limitations.some((item) => /no production customer traffic/i.test(item)));
process.stdout.write('Benchmark evidence meets documented local thresholds.\n');
