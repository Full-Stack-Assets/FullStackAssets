import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('release runbook preserves separate static/api deployment boundary after provider approval', () => {
  const s = readFileSync('docs/runbooks/marketplace-release.md', 'utf8');
  assert.match(s, /two intentionally separate production surfaces/i);
  assert.match(s, /provider gate.*resolved/i);
  assert.match(s, /Supabase Edge Function `marketplace-api`/i);
  assert.match(s, /GitHub Pages remains independently deployable/i);
  assert.match(s, /Paid commerce remains intentionally disabled/i);
});
