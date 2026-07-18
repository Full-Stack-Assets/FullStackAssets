import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest, type RunRecord, type RunStore } from '../src/index.js';

class MemoryStore implements RunStore {
  records: RunRecord[] = [];
  async save<T>(record: RunRecord<T>): Promise<void> {
    this.records.push(structuredClone(record) as RunRecord);
  }
  async load<T = unknown>(runId: string): Promise<RunRecord<T> | null> {
    const record = [...this.records].reverse().find((item) => item.runId === runId);
    return (record ?? null) as RunRecord<T> | null;
  }
}

test('health endpoint reports runtime identity', async () => {
  const response = await handleRequest(new Request('http://localhost/health'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    product: 'TaskFlow Runtime',
    studio: 'planned',
  });
});

test('client intake endpoint rejects malformed JSON', async () => {
  const response = await handleRequest(
    new Request('http://localhost/v1/runs/client-intake', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{broken',
    }),
    { store: new MemoryStore(), idFactory: () => 'http-malformed' },
  );

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /valid json/i);
});

test('client intake endpoint returns a failed evidence record for invalid input', async () => {
  const response = await handleRequest(
    new Request('http://localhost/v1/runs/client-intake', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Broken Input Co',
        contactName: 'Jamie',
        email: 'invalid',
        requestedService: 'Automation',
        budgetUsd: 1000,
        timeline: '2 weeks',
        goals: ['Reduce manual work'],
      }),
    }),
    { store: new MemoryStore(), idFactory: () => 'http-invalid' },
  );

  assert.equal(response.status, 422);
  const body = await response.json();
  assert.equal(body.runId, 'http-invalid');
  assert.equal(body.status, 'failed');
  assert.match(body.error, /valid contact email/i);
});

test('client intake endpoint runs and verifies a valid workflow', async () => {
  const response = await handleRequest(
    new Request('http://localhost/v1/runs/client-intake', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Harbor Electric',
        contactName: 'Alex Rivera',
        email: 'alex@harbor-electric.example',
        requestedService: 'AI lead follow-up automation',
        budgetUsd: 12000,
        timeline: '8 weeks',
        goals: ['Respond faster', 'Reduce CRM updates'],
      }),
    }),
    { store: new MemoryStore(), idFactory: () => 'http-success' },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.runId, 'http-success');
  assert.equal(body.status, 'succeeded');
  assert.equal(body.verification.verified, true);
  assert.equal(body.output.qualification.tier, 'transformation');
});
