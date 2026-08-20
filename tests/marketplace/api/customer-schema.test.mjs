import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql=readFileSync('marketplace/db/migrations/002_customer_library.sql','utf8');
for(const table of ['users','organizations','memberships','purchases','subscriptions','entitlements','installations','collections','collection_items','update_preferences']) test(`schema creates ${table}`,()=>assert.match(sql,new RegExp(`CREATE TABLE ${table}`,'i')));
test('membership and entitlement constraints are explicit',()=>{
  assert.match(sql,/UNIQUE\s*\(organization_id,\s*user_id\)/i);
  assert.match(sql,/product_id TEXT NOT NULL REFERENCES products\(id\)/i);
  assert.match(sql,/product_version_id TEXT NOT NULL REFERENCES product_versions\(id\)/i);
  assert.match(sql,/runtime_distribution_id TEXT REFERENCES runtime_distributions\(id\)/i);
  assert.match(sql,/external_subject TEXT NOT NULL/);
  assert.doesNotMatch(sql,/email TEXT PRIMARY KEY/i);
});
