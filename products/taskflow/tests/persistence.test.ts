import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonFileRunStore, type RunRecord } from '../src/index.js';

function record(runId: string, status: RunRecord['status']): RunRecord {
  return {
    schemaVersion: 1,
    runId,
    workflowId: 'persistence-test',
    status,
    startedAt: '2026-07-18T12:00:00.000Z',
    input: { safe: true },
    events: [],
    usage: [],
    totalCostUsd: 0,
  };
}

test('JsonFileRunStore saves and loads a run record', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'taskflow-store-'));
  try {
    const store = new JsonFileRunStore(directory);
    await store.save(record('run-1', 'planned'));

    assert.deepEqual(await store.load('run-1'), record('run-1', 'planned'));
    const raw = await readFile(join(directory, 'run-1.json'), 'utf8');
    assert.match(raw, /"workflowId": "persistence-test"/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('JsonFileRunStore atomically replaces an existing record', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'taskflow-store-'));
  try {
    const store = new JsonFileRunStore(directory);
    await store.save(record('run-2', 'planned'));
    await store.save(record('run-2', 'succeeded'));

    assert.equal((await store.load('run-2'))?.status, 'succeeded');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('JsonFileRunStore returns null for an unknown run', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'taskflow-store-'));
  try {
    const store = new JsonFileRunStore(directory);
    assert.equal(await store.load('missing'), null);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('JsonFileRunStore rejects unsafe run identifiers', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'taskflow-store-'));
  try {
    const store = new JsonFileRunStore(directory);
    await assert.rejects(store.save(record('../escape', 'planned')), /unsafe run id/i);
    await assert.rejects(store.load('../escape'), /unsafe run id/i);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
