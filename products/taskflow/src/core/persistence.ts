import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RunRecord, RunStore } from './types.js';

const SAFE_RUN_ID = /^[A-Za-z0-9._-]+$/;

function assertSafeRunId(runId: string): void {
  if (!SAFE_RUN_ID.test(runId)) {
    throw new Error(`Unsafe run id: ${runId}`);
  }
}

export class JsonFileRunStore implements RunStore {
  constructor(private readonly directory: string) {}

  async save<Output>(record: RunRecord<Output>): Promise<void> {
    assertSafeRunId(record.runId);
    await mkdir(this.directory, { recursive: true });
    const target = join(this.directory, `${record.runId}.json`);
    const temporary = join(
      this.directory,
      `.${record.runId}.${process.pid}.${randomUUID()}.tmp`,
    );

    try {
      await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, {
        encoding: 'utf8',
        mode: 0o600,
      });
      await rename(temporary, target);
    } finally {
      await rm(temporary, { force: true });
    }
  }

  async load<Output = unknown>(runId: string): Promise<RunRecord<Output> | null> {
    assertSafeRunId(runId);
    try {
      const raw = await readFile(join(this.directory, `${runId}.json`), 'utf8');
      return JSON.parse(raw) as RunRecord<Output>;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }
}
