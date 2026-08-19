import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql=readFileSync(new URL('../../../marketplace/db/migrations/005_runtime_distribution_factory.sql',import.meta.url),'utf8');

test('runtime compatibility receipts are immutable evidence rows',()=>{
  assert.match(sql,/CREATE TABLE IF NOT EXISTS runtime_compatibility_receipts/);
  assert.match(sql,/product_version_id TEXT NOT NULL REFERENCES product_versions\(id\)/);
  assert.match(sql,/state TEXT NOT NULL CHECK \(state IN \('VERIFIED','EXPERIMENTAL','UNAVAILABLE','BLOCKED','DEPRECATED'\)\)/);
  assert.match(sql,/evidence_receipt_id TEXT NOT NULL/);
  assert.match(sql,/UNIQUE\(product_version_id,runtime,adapter_version,evidence_receipt_id\)/);
});

test('runtime package plans bind canonical snapshot hash',()=>{
  assert.match(sql,/CREATE TABLE IF NOT EXISTS runtime_package_plans/);
  assert.match(sql,/canonical_snapshot_hash TEXT NOT NULL/);
  assert.match(sql,/UNIQUE\(product_version_id,runtime,adapter_version,plan_hash\)/);
});
