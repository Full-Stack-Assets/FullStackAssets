import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  createClientIntakeWorkflow,
  runWorkflow,
  type ClientIntakeInput,
  type ClientIntakeOutput,
  type RunRecord,
  type RunStore,
  type RuntimeClock,
} from '../src/index.js';

class CaptureStore implements RunStore {
  last: RunRecord | null = null;

  async save<T>(record: RunRecord<T>): Promise<void> {
    this.last = structuredClone(record) as RunRecord;
  }

  async load<T = unknown>(runId: string): Promise<RunRecord<T> | null> {
    if (this.last?.runId !== runId) return null;
    return structuredClone(this.last) as RunRecord<T>;
  }
}

class IncrementingClock implements RuntimeClock {
  private currentMs: number;

  constructor(startIso: string, private readonly incrementMs = 5) {
    this.currentMs = Date.parse(startIso);
  }

  now(): Date {
    const value = new Date(this.currentMs);
    this.currentMs += this.incrementMs;
    return value;
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

export async function runClientIntakeDemo(
  outputPath = resolve('demo/runs/2026-07-18-client-intake.json'),
): Promise<RunRecord<ClientIntakeOutput>> {
  const inputUrl = new URL('../../demo/input/client-intake.json', import.meta.url);
  const input = JSON.parse(await readFile(inputUrl, 'utf8')) as ClientIntakeInput;
  const store = new CaptureStore();

  const record = await runWorkflow(
    createClientIntakeWorkflow({ failStepOnce: 'qualify-opportunity' }),
    input,
    {
      store,
      idFactory: () => 'demo-client-intake-2026-07-18',
      clock: new IncrementingClock('2026-07-18T16:00:00.000Z'),
    },
  );

  await writeJsonAtomically(outputPath, record);
  return record;
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(resolve(entry)).href) {
  const outputPath = process.argv[2] ? resolve(process.argv[2]) : undefined;
  const record = await runClientIntakeDemo(outputPath);
  process.stdout.write(`${JSON.stringify({
    runId: record.runId,
    status: record.status,
    verified: record.verification?.verified ?? false,
    durationMs: record.durationMs,
    totalCostUsd: record.totalCostUsd,
  }, null, 2)}\n`);
}
