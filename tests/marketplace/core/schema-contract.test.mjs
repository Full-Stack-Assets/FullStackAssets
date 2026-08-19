import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const path = 'marketplace/db/migrations/001_marketplace_core.sql';

test('marketplace core migration exists with immutable product version contract', () => {
  assert.equal(existsSync(path), true);
  const sql = readFileSync(path, 'utf8');
  assert.match(sql, /CREATE TABLE product_versions/i);
  assert.match(sql, /UNIQUE\s*\(product_id,\s*version\)/i);
  assert.match(sql, /canonical_hash/i);
  assert.match(sql, /CREATE TABLE outbox_events/i);
  assert.match(sql, /CREATE TABLE product_version_availability/i);
  assert.match(sql, /LEGAL_HOLD/i);
  assert.match(sql, /prevent_published_product_version_mutation/i);
  assert.match(sql, /publication_state\s*=\s*'PUBLISHED'/i);
});

test('marketplace core migration defines all frozen core tables', () => {
  const sql = readFileSync(path, 'utf8');
  for (const table of [
    'publishers','products','product_versions','product_components','runtime_distributions',
    'evaluation_records','publication_records','offers','license_policies','outbox_events','projection_receipts',
  ]) assert.match(sql, new RegExp(`CREATE TABLE ${table}`, 'i'), table);
});

test('machine state constraints use uppercase values', () => {
  const sql = readFileSync(path, 'utf8');
  assert.match(sql, /REFERENCE_ONLY/);
  assert.match(sql, /COMMERCIAL_READY/);
  assert.match(sql, /VERIFIED/);
  assert.doesNotMatch(sql, /'reference_only'|'published'|'verified'/);
});
