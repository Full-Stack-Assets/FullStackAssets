import { performance } from 'node:perf_hooks';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  calculateBenchmarkMetrics,
  createClientIntakeWorkflow,
  runWorkflow,
  type BenchmarkMetrics,
  type BenchmarkSample,
  type ClientIntakeInput,
  type RunRecord,
  type RunStore,
} from '../src/index.js';

interface BenchmarkCase {
  id: string;
  expectedVerified: boolean;
  input: ClientIntakeInput;
}

interface CaseSummary {
  caseId: string;
  expectedVerified: boolean;
  runs: number;
  matchedOutcomes: number;
  averageLatencyMs: number;
}

export interface BenchmarkReport {
  schemaVersion: 1;
  benchmark: 'taskflow-client-intake-local';
  generatedAt: string;
  environment: {
    node: string;
    platform: NodeJS.Platform;
    architecture: string;
  };
  datasetCases: number;
  iterations: number;
  metrics: BenchmarkMetrics;
  caseSummaries: CaseSummary[];
  limitations: string[];
}

export interface RunBenchmarkOptions {
  outputPath?: string;
  iterations?: number;
}

class MemoryStore implements RunStore {
  async save<T>(_record: RunRecord<T>): Promise<void> {
    return undefined;
  }

  async load<T = unknown>(_runId: string): Promise<RunRecord<T> | null> {
    return null;
  }
}

async function writeJsonAtomically(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

function summarizeCases(samples: BenchmarkSample[], cases: BenchmarkCase[]): CaseSummary[] {
  return cases.map((benchmarkCase) => {
    const matching = samples.filter((sample) => sample.caseId === benchmarkCase.id);
    const latencyTotal = matching.reduce((sum, sample) => sum + sample.latencyMs, 0);
    return {
      caseId: benchmarkCase.id,
      expectedVerified: benchmarkCase.expectedVerified,
      runs: matching.length,
      matchedOutcomes: matching.filter(
        (sample) => sample.expectedVerified === sample.actualVerified,
      ).length,
      averageLatencyMs: matching.length === 0
        ? 0
        : Number((latencyTotal / matching.length).toFixed(3)),
    };
  });
}

export async function runBenchmark(
  options: RunBenchmarkOptions = {},
): Promise<BenchmarkReport> {
  const iterations = options.iterations ?? 25;
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new RangeError('iterations must be a positive integer');
  }
  const outputPath = options.outputPath
    ? resolve(options.outputPath)
    : resolve('benchmarks/results/2026-07-18-local.json');
  const casesUrl = new URL('../../benchmarks/cases.json', import.meta.url);
  const cases = JSON.parse(await readFile(casesUrl, 'utf8')) as BenchmarkCase[];
  const samples: BenchmarkSample[] = [];

  for (let iteration = 1; iteration <= iterations; iteration += 1) {
    for (const benchmarkCase of cases) {
      const start = performance.now();
      const record = await runWorkflow(
        createClientIntakeWorkflow(),
        benchmarkCase.input,
        {
          store: new MemoryStore(),
          idFactory: () => `benchmark-${iteration}-${benchmarkCase.id}`,
        },
      );
      const latencyMs = Number((performance.now() - start).toFixed(3));
      samples.push({
        caseId: benchmarkCase.id,
        expectedVerified: benchmarkCase.expectedVerified,
        actualVerified: record.status === 'succeeded' && record.verification?.verified === true,
        latencyMs,
        costUsd: record.totalCostUsd,
      });
    }
  }

  const report: BenchmarkReport = {
    schemaVersion: 1,
    benchmark: 'taskflow-client-intake-local',
    generatedAt: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
    },
    datasetCases: cases.length,
    iterations,
    metrics: calculateBenchmarkMetrics(samples),
    caseSummaries: summarizeCases(samples, cases),
    limitations: [
      'Synthetic deterministic client-intake cases; no production customer traffic.',
      'Local wall-clock latency includes only in-process workflow execution.',
      'Recorded cost is zero because the included workflow uses no paid model or connector.',
      'Verification accuracy measures expected outcome classification on this checked-in dataset only.',
    ],
  };

  await writeJsonAtomically(outputPath, report);
  return report;
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(resolve(entry)).href) {
  const outputPath = process.argv[2];
  const iterations = process.argv[3] ? Number(process.argv[3]) : undefined;
  const options: RunBenchmarkOptions = {};
  if (outputPath) options.outputPath = outputPath;
  if (iterations !== undefined) options.iterations = iterations;
  const report = await runBenchmark(options);
  process.stdout.write(`${JSON.stringify(report.metrics, null, 2)}\n`);
}
