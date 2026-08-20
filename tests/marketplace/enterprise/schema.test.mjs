import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql=readFileSync(new URL('../../../marketplace/db/migrations/006_enterprise_registry.sql',import.meta.url),'utf8');

test('enterprise schema creates private registry and policy tables',()=>{
  for(const table of ['private_registries','private_registry_products','enterprise_policy_overlays','publisher_verifications','publisher_revenue_share_policies','enterprise_audit_events'])assert.match(sql,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
});

test('private registry references marketplace products and versions rather than Canon definitions',()=>{
  assert.match(sql,/product_id TEXT NOT NULL REFERENCES products\(id\)/);
  assert.match(sql,/product_version_id TEXT REFERENCES product_versions\(id\)/);
  assert.doesNotMatch(sql,/canonical_content|skill_definition|role_definition/);
});

test('revenue share totals exactly 10000 basis points in database constraint',()=>assert.match(sql,/platform_basis_points \+ publisher_basis_points = 10000/));
