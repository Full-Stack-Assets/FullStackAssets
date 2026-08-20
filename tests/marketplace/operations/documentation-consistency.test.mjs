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

test('README documents Units 4 through 8 and the production deployment boundary', () => {
  const readme = read('README.md');
  for (const unit of [4, 5, 6, 7, 8]) assert.match(readme, new RegExp(`Unit ${unit}:`));
  assert.match(readme, /docs\/runbooks\/marketplace-release\.md/);
  assert.match(readme, /API production deployment.*decision gate/is);
  assert.match(readme, /GitHub Pages.*public static/i);
});

test('release runbook keeps backend deployment as an explicit provider decision gate', () => {
  const runbook = read('docs/runbooks/marketplace-release.md');
  assert.match(runbook, /decision gate/i);
  assert.match(runbook, /compute\/runtime provider/i);
  assert.match(runbook, /PostgreSQL/i);
  assert.match(runbook, /OIDC/i);
  assert.match(runbook, /S3-compatible/i);
  assert.match(runbook, /Stripe.*paid launch/is);
  assert.match(runbook, /GitHub Pages.*independently/is);
  assert.doesNotMatch(runbook, /AppDeploy/i);
});
