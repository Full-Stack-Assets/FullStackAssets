import test from 'node:test';
import assert from 'node:assert/strict';
import { MarketplaceRepository } from '../../../marketplace/core/repository.mjs';
import { createMemoryRepository } from '../../../marketplace/core/memory-repository.mjs';

test('repository contract is explicit', () => {
  const repo = new MarketplaceRepository();
  assert.throws(() => repo.insertProduct({}), /not implemented/i);
});

test('transaction commits product and outbox together', async () => {
  const repo = createMemoryRepository();
  await repo.transaction(async (tx) => {
    await tx.insertProduct({ id: 'PRD-001', canonical_refs: ['SKL-026'] });
    await tx.appendOutbox({ id: 'OB-1', event_type: 'PRODUCT_CREATED' });
  });
  assert.equal((await repo.listOutbox()).length, 1);
  assert.equal((await repo.getProductByCanonicalRef('SKL-026')).id, 'PRD-001');
});

test('transaction rollback leaves all collections unchanged', async () => {
  const repo = createMemoryRepository();
  await assert.rejects(repo.transaction(async (tx) => {
    await tx.insertProduct({ id: 'PRD-001', canonical_refs: ['SKL-026'] });
    await tx.appendOutbox({ id: 'OB-1', event_type: 'PRODUCT_CREATED' });
    throw new Error('boom');
  }), /boom/);
  assert.equal(await repo.getProductByCanonicalRef('SKL-026'), null);
  assert.deepEqual(await repo.listOutbox(), []);
});

test('projection receipts are unique by fingerprint', async () => {
  const repo = createMemoryRepository();
  await repo.putProjectionReceipt({ fingerprint: 'fp-1', event_id: 'EVT-1' });
  await assert.rejects(repo.putProjectionReceipt({ fingerprint: 'fp-1', event_id: 'EVT-1' }), /duplicate projection receipt/i);
  assert.equal((await repo.getProjectionReceipt('fp-1')).event_id, 'EVT-1');
});

test('product versions are listed in semantic order and availability is separate', async () => {
  const repo = createMemoryRepository();
  await repo.insertProduct({ id: 'PRD-001', canonical_refs: ['SKL-026'] });
  await repo.insertProductVersion({ id: 'V2', product_id: 'PRD-001', version: '1.1.0', publication_state: 'DRAFT' });
  await repo.insertProductVersion({ id: 'V1', product_id: 'PRD-001', version: '1.0.0', publication_state: 'PUBLISHED' });
  assert.deepEqual((await repo.listProductVersions('PRD-001')).map(v => v.version), ['1.0.0','1.1.0']);
  await repo.setAvailability('V1', 'ACTIVE', null);
  assert.equal((await repo.getAvailability('V1')).availability_state, 'ACTIVE');
});
