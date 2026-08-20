import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryRepository } from '../../../marketplace/core/memory-repository.mjs';
import { projectCanonEvent, deterministicProductId } from '../../../marketplace/core/projector.mjs';

const HASH = 'a'.repeat(64);

function skillEvent(overrides = {}) {
  return {
    id: 'EVT-1', event_type: 'CANON_CREATED', entity_type: 'SKILL', entity_id: 'SKL-046',
    new_version: '1.0.0', content_hash: HASH, ...overrides,
  };
}
function skillEntity(overrides = {}) {
  return { id: 'SKL-046', entity_type: 'SKILL', name: 'Repository Archaeology', version: '1.0.0', content_hash: HASH, ...overrides };
}

test('new canonical skill creates a reference-only product and draft version', async () => {
  const repo = createMemoryRepository();
  const result = await projectCanonEvent(repo, skillEvent(), skillEntity());
  assert.equal(result.status, 'CREATED');
  const product = await repo.getProductByCanonicalRef('SKL-046');
  assert.equal(product.id, deterministicProductId('SKL-046'));
  assert.equal(product.commercial_state, 'REFERENCE_ONLY');
  const versions = await repo.listProductVersions(product.id);
  assert.equal(versions.length, 1);
  assert.equal(versions[0].publication_state, 'DRAFT');
});

test('duplicate event is a no-op', async () => {
  const repo = createMemoryRepository();
  const first = await projectCanonEvent(repo, skillEvent(), skillEntity());
  const second = await projectCanonEvent(repo, skillEvent(), skillEntity());
  assert.equal(first.status, 'CREATED');
  assert.equal(second.status, 'NOOP');
  const product = await repo.getProductByCanonicalRef('SKL-046');
  assert.equal((await repo.listProductVersions(product.id)).length, 1);
  assert.equal((await repo.listProjectionReceipts()).length, 1);
});

test('canonical update creates a new immutable draft version without commercializing', async () => {
  const repo = createMemoryRepository();
  await projectCanonEvent(repo, skillEvent(), skillEntity());
  const hash2 = 'b'.repeat(64);
  const result = await projectCanonEvent(repo,
    skillEvent({ id:'EVT-2', event_type:'CANON_UPDATED', new_version:'1.1.0', content_hash:hash2 }),
    skillEntity({ version:'1.1.0', content_hash:hash2 }),
  );
  assert.equal(result.status, 'VERSION_CREATED');
  const product = await repo.getProductByCanonicalRef('SKL-046');
  assert.equal(product.commercial_state, 'REFERENCE_ONLY');
  assert.deepEqual((await repo.listProductVersions(product.id)).map(v => v.version), ['1.0.0','1.1.0']);
});

test('projector rejects event/entity identity mismatch', async () => {
  const repo = createMemoryRepository();
  await assert.rejects(projectCanonEvent(repo, skillEvent(), skillEntity({ id:'SKL-999' })), /identity mismatch/i);
});
