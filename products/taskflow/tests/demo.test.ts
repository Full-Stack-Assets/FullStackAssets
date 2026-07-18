import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runClientIntakeDemo } from '../scripts/run-demo.js';
import type { ClientIntakeOutput, RunRecord } from '../src/index.js';

test('reproducible demo emits a verified retrying run log', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'taskflow-demo-'));
  const outputPath = join(directory, 'run.json');
  try {
    const record = await runClientIntakeDemo(outputPath);
    const persisted = JSON.parse(await readFile(outputPath, 'utf8')) as RunRecord<ClientIntakeOutput>;

    assert.deepEqual(persisted, record);
    assert.equal(record.runId, 'demo-client-intake-2026-07-18');
    assert.equal(record.status, 'succeeded');
    assert.equal(record.verification?.verified, true);
    assert.equal(record.totalCostUsd, 0);
    assert.equal(record.output?.qualification.tier, 'transformation');
    assert.equal(
      record.events.filter((event) => event.type === 'step_attempt_failed').length,
      1,
    );
    assert.equal(
      record.events.find((event) => event.type === 'step_attempt_failed')?.stepId,
      'qualify-opportunity',
    );
    assert.equal(record.startedAt, '2026-07-18T16:00:00.000Z');
    assert.ok((record.durationMs ?? 0) > 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
