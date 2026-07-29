import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const required = [
  'README.md',
  'docs/architecture.md',
  'docs/threat-model.md',
  'docs/deployment.md',
  'docs/dependencies.md',
  'docs/metrics.md',
  'SECURITY.md',
  'demo/runs/2026-07-18-client-intake.json',
  'benchmarks/results/2026-07-18-local.json',
];

for (const path of required) await access(resolve(path));

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(Object.keys(packageJson.dependencies ?? {}).length, 0, 'production dependencies must remain empty');

const report = JSON.parse(await readFile('benchmarks/results/2026-07-18-local.json', 'utf8'));
assert.equal(report.metrics.verificationAccuracy, 1);
assert.equal(report.metrics.taskCompletionRate, 1);
assert.equal(report.metrics.totalCostUsd, 0);
assert.ok(report.limitations.some((item) => /no production customer traffic/i.test(item)));

const markdownFiles = required.filter((path) => path.endsWith('.md'));
for (const path of markdownFiles) {
  const text = await readFile(path, 'utf8');
  assert.doesNotMatch(text, /\b(TBD|TODO|FIXME)\b/, `${path} contains a placeholder`);
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (!target || target.startsWith('http') || target.startsWith('#') || target.startsWith('mailto:')) continue;
    const withoutAnchor = target.split('#')[0];
    if (!withoutAnchor) continue;
    await access(resolve(dirname(path), withoutAnchor));
  }
}

process.stdout.write('Documentation paths, claims, and evidence checks passed.\n');
