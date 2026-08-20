import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=(path)=>readFileSync(path,'utf8');

const MARKETPLACE_TABLES=['publishers','products','product_versions','product_version_availability','product_components','runtime_distributions','evaluation_records','publication_records','license_policies','offers','projection_receipts','outbox_events','users','organizations','memberships','purchases','subscriptions','entitlements','installations','collections','collection_items','update_preferences','publisher_memberships','commercial_candidates','canon_change_proposals','publication_reviews','runtime_build_jobs','publisher_audit_events','payment_events','commerce_receipts','runtime_compatibility_receipts','runtime_package_plans','private_registries','private_registry_products','enterprise_policy_overlays','publisher_verifications','publisher_revenue_share_policies','enterprise_audit_events'];

test('Supabase Edge adapter composes the existing marketplace router and services',()=>{
  const source=read('supabase/functions/marketplace-api/index.ts');
  for(const token of ['createRouter','createPostgres','createCustomerRepository','createCustomerLibraryService','createDownloadService','createDistributionService','createEnterpriseService','createPublisherService','createReadinessService']) assert.match(source,new RegExp(token));
  assert.match(source,/SUPABASE_DB_URL/);
  assert.match(source,/SUPABASE_URL/);
  assert.match(source,/SUPABASE_JWKS/);
  assert.match(source,/export default\s*\{\s*fetch/s);
  assert.doesNotMatch(source,/postgres(?:ql)?:\/\/[^\s'\"]+:[^@\s'\"]+@/i);
  assert.doesNotMatch(source,/sk_live_[A-Za-z0-9]+/);
});

test('Supabase production hardening blocks direct public table access and persists authority separately',()=>{
  const sql=read('marketplace/db/migrations/007_supabase_production_hardening.sql');
  for(const table of MARKETPLACE_TABLES){
    assert.match(sql,new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`,'i'),table);
  }
  assert.match(sql,/REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated/i);
  assert.match(sql,/CREATE TABLE IF NOT EXISTS marketplace_app_roles/i);
  assert.match(sql,/CREATE TABLE IF NOT EXISTS marketplace_human_authority_grants/i);
  assert.match(sql,/marketplace-artifacts/i);
  assert.match(sql,/public\s*=\s*false/i);
});

test('Supabase function configuration leaves authentication to the existing router so Stripe webhook semantics remain possible',()=>{
  const config=read('supabase/config.toml');
  assert.match(config,/\[functions\.marketplace-api\]/);
  assert.match(config,/verify_jwt\s*=\s*false/);
});

test('production runbook records the selected stack without claiming paid commerce',()=>{
  const runbook=read('docs/runbooks/marketplace-supabase-production.md');
  assert.match(runbook,/Supabase/i);
  assert.match(runbook,/PostgreSQL/i);
  assert.match(runbook,/OIDC|JWKS/i);
  assert.match(runbook,/S3-compatible/i);
  assert.match(runbook,/paid launch.*not enabled/i);
  assert.match(runbook,/Full-Stack-Assets/i);
});

test('production workflow runs inherited and provider-specific verification',()=>{
  const workflow=read('.github/workflows/marketplace-production.yml');
  for(const path of ['tests/marketplace/canon/*.test.mjs','tests/marketplace/core/*.test.mjs','tests/marketplace/catalog/*.test.mjs','tests/marketplace/api/*.test.mjs','tests/marketplace/customer/*.test.mjs','tests/marketplace/publisher/*.test.mjs','tests/marketplace/distribution/*.test.mjs','tests/marketplace/commerce/*.test.mjs','tests/marketplace/security/*.test.mjs','tests/marketplace/operations/*.test.mjs','tests/marketplace/release/*.test.mjs','tests/marketplace/enterprise/*.test.mjs','tests/marketplace/launch/*.test.mjs','tests/marketplace/production/*.test.mjs']) assert.ok(workflow.includes(path),path);
  assert.match(workflow,/npm ci/);
});
