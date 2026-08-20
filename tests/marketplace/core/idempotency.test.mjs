import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryRepository } from '../../../marketplace/core/memory-repository.mjs';
import { projectCanonEvent } from '../../../marketplace/core/projector.mjs';
import { transitionVersion } from '../../../marketplace/core/state-machine.mjs';

const H11 = '2'.repeat(64);
const H101 = '3'.repeat(64);

function event(id, version, hash, type='CANON_UPDATED') {
  return { id, event_type:type, entity_type:'SKILL', entity_id:'SKL-046', new_version:version, content_hash:hash };
}
function entity(version, hash) {
  return { id:'SKL-046', entity_type:'SKILL', name:'Repository Archaeology', version, content_hash:hash };
}

test('duplicate and out-of-order events preserve the highest candidate version', async () => {
  const repo = createMemoryRepository();
  await projectCanonEvent(repo, event('EVT-1','1.1.0',H11,'CANON_CREATED'), entity('1.1.0',H11));
  await projectCanonEvent(repo, event('EVT-2','1.0.1',H101), entity('1.0.1',H101));
  const duplicate = await projectCanonEvent(repo, event('EVT-2','1.0.1',H101), entity('1.0.1',H101));
  assert.equal(duplicate.status, 'NOOP');
  const product = await repo.getProductByCanonicalRef('SKL-046');
  const versions = await repo.listProductVersions(product.id);
  assert.deepEqual(versions.map(v => v.version), ['1.0.1','1.1.0']);
  assert.equal(versions.at(-1).version, '1.1.0');
  assert.equal((await repo.listProjectionReceipts()).length, 2);
});

test('failed new evaluation cannot disturb last-known-good published availability', async () => {
  const repo = createMemoryRepository();
  const product = {id:'PRD-001', canonical_refs:['SKL-046']};
  await repo.insertProduct(product);
  await repo.insertProductVersion({id:'PV-100', product_id:'PRD-001', version:'1.0.0', publication_state:'PUBLISHED'});
  await repo.setAvailability('PV-100','ACTIVE',null);

  await projectCanonEvent(repo, event('EVT-2','1.1.0',H11), entity('1.1.0',H11));
  assert.equal(transitionVersion('EVALUATING','BLOCKED_EVALUATION'), 'BLOCKED_EVALUATION');
  assert.equal((await repo.getAvailability('PV-100')).availability_state, 'ACTIVE');
  const versions = await repo.listProductVersions('PRD-001');
  const candidate = versions.find(v => v.version === '1.1.0');
  assert.equal(candidate.publication_state, 'DRAFT');
  assert.equal(await repo.getAvailability(candidate.id), null);
});
