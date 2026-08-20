import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

test('implementation index reflects the complete eight-unit architecture', () => {
  const index = read('docs/superpowers/plans/2026-08-19-agent-library-marketplace-implementation-index.md');
  assert.match(index, /eight serial/i);
  assert.match(index, /unit-7-runtime-distribution\.md/);
  assert.match(index, /unit-8-enterprise-governance\.md/);
  assert.match(index, /tests\/marketplace\/distribution\/\*\.test\.mjs/);
  assert.match(index, /tests\/marketplace\/enterprise\/\*\.test\.mjs/);
  assert.match(index, /tests\/marketplace\/launch\/\*\.test\.mjs/);
});

test('README documents Units 4 through 8 and the resolved production deployment', () => {
  const readme = read('README.md');
  for (const unit of [4, 5, 6, 7, 8]) assert.match(readme, new RegExp(`Unit ${unit}:`));
  assert.match(readme, /docs\/runbooks\/marketplace-supabase-production\.md/);
  assert.match(readme, /Supabase Edge Function `marketplace-api`/i);
  assert.match(readme, /GitHub Pages/i);
  assert.match(readme, /paid commerce remains disabled/i);
});

test('release runbook records the approved provider without changing authority boundaries', () => {
  const runbook = read('docs/runbooks/marketplace-release.md');
  assert.match(runbook, /provider gate.*resolved/i);
  assert.match(runbook, /Supabase Edge Function/i);
  assert.match(runbook, /PostgreSQL/i);
  assert.match(runbook, /Auth\/OIDC\/JWKS/i);
  assert.match(runbook, /marketplace-artifacts/i);
  assert.match(runbook, /paid commerce remains intentionally disabled/i);
  assert.match(runbook, /GitHub Pages/i);
  assert.match(runbook, /Human Authority/i);
  assert.doesNotMatch(runbook, /AppDeploy/i);
});
