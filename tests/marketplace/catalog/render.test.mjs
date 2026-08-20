import test from 'node:test';
import assert from 'node:assert/strict';
import { renderEntry, entryRoute } from '../../../marketplace/catalog/render.mjs';

test('renders escaped skill page at canonical route', () => {
  const entry={id:'SKL-026',type:'SKILL',slug:'skl-026-code-generation-secure-implementation',name:'Code Generation & Secure Implementation',description:'Build <safe> code',commercial_state:'PAID',commerce:{currency:'USD',amount:5900},compatibility:[]};
  const output=renderEntry(entry);
  assert.equal(entryRoute(entry),'/library/skills/skl-026-code-generation-secure-implementation/');
  assert.match(output,/SKL-026/);
  assert.match(output,/Code Generation &amp; Secure Implementation/);
  assert.match(output,/Build &lt;safe&gt; code/);
  assert.match(output,/\/library\/skills\/skl-026-code-generation-secure-implementation\//);
});

test('reference-only entries do not expose commerce or install actions', () => {
  const output=renderEntry({id:'ESP-07',type:'AGENT',slug:'esp-07-security-posture-analyst',name:'Security Posture Analyst',commercial_state:'REFERENCE_ONLY',compatibility:[]});
  assert.match(output,/Reference only/);
  assert.doesNotMatch(output,/>Install</);
  assert.doesNotMatch(output,/View offer/);
});
