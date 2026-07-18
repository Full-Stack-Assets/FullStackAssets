import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runClientIntakeDemo } from './run-demo.js';

const checkedPath = resolve('demo/runs/2026-07-18-client-intake.json');
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'taskflow-demo-verify-'));
try {
  const generatedPath = join(temporaryDirectory, 'generated.json');
  await runClientIntakeDemo(generatedPath);
  const checked = JSON.parse(await readFile(checkedPath, 'utf8')) as unknown;
  const generated = JSON.parse(await readFile(generatedPath, 'utf8')) as unknown;
  assert.deepEqual(generated, checked);
  process.stdout.write('Demo artifact is reproducible.\n');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
