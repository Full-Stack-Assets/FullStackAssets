import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMERCIAL_STATES, PRODUCT_TYPES, VERSION_STATES, COMPATIBILITY_STATES, createProduct, createProductVersion } from '../../../marketplace/core/records.mjs';

test('reference-only is a first-class commercial state', () => {
  assert.ok(COMMERCIAL_STATES.includes('REFERENCE_ONLY'));
  assert.ok(COMMERCIAL_STATES.includes('FREE'));
  assert.ok(COMMERCIAL_STATES.includes('PAID'));
});

test('core enums are uppercase persisted constants', () => {
  for (const values of [PRODUCT_TYPES, COMMERCIAL_STATES, VERSION_STATES, COMPATIBILITY_STATES]) {
    assert.ok(values.length > 0);
    assert.ok(values.every((value) => value === value.toUpperCase()));
  }
});

test('createProduct defaults to reference-only and freezes identity', () => {
  const product = createProduct({
    id: 'PRD-001', publisher_id: 'PUB-001', type: 'SKILL',
    canonical_refs: ['SKL-026'], slug: 'secure-implementation',
  });
  assert.equal(product.commercial_state, 'REFERENCE_ONLY');
  assert.equal(product.visibility, 'PRIVATE');
  assert.ok(Object.isFrozen(product));
  assert.ok(Object.isFrozen(product.canonical_refs));
});

test('product versions require canonical hashes', () => {
  assert.throws(() => createProductVersion({
    id: 'PRDV-001', product_id: 'PRD-001', version: '1.0.0',
    canonical_snapshot: { refs: ['SKL-026'], hashes: [], canon_versions: ['1.0.0'] },
  }), /hash/i);
});

test('product versions require aligned canonical snapshot tuples and are immutable', () => {
  const version = createProductVersion({
    id: 'PRDV-001', product_id: 'PRD-001', version: '1.0.0',
    canonical_snapshot: {
      refs: ['SKL-026'],
      hashes: ['a'.repeat(64)],
      canon_versions: ['1.0.0'],
    },
  });
  assert.equal(version.publication_state, 'DRAFT');
  assert.ok(Object.isFrozen(version));
  assert.ok(Object.isFrozen(version.canonical_snapshot));
  assert.ok(Object.isFrozen(version.canonical_snapshot.refs));
});
