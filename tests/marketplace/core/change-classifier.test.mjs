import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCanonicalChange } from '../../../marketplace/core/change-classifier.mjs';

test('description-only change is PATCH', () => {
  assert.equal(classifyCanonicalChange({description:'A'}, {description:'B'}), 'PATCH');
});

test('additive optional output is MINOR', () => {
  assert.equal(classifyCanonicalChange({outputs:['a']}, {outputs:['a','b']}), 'MINOR');
});

test('new integration is MAJOR', () => {
  assert.equal(classifyCanonicalChange({integration_ids:['INT-007']}, {integration_ids:['INT-007','INT-016']}), 'MAJOR');
});

test('risk escalation is MAJOR', () => {
  assert.equal(classifyCanonicalChange({risk_tier:'LOW'}, {risk_tier:'HIGH'}), 'MAJOR');
});

test('authority, sensitive data, or prohibited-action changes are MAJOR', () => {
  assert.equal(classifyCanonicalChange({permission_tier:'I1'}, {permission_tier:'I3'}), 'MAJOR');
  assert.equal(classifyCanonicalChange({data_classifications:['PUBLIC']}, {data_classifications:['PUBLIC','RESTRICTED']}), 'MAJOR');
  assert.equal(classifyCanonicalChange({prohibited_actions:['deploy']}, {prohibited_actions:[]}), 'MAJOR');
});

test('runtime compatibility addition is MINOR but removal is MAJOR', () => {
  assert.equal(classifyCanonicalChange({runtime_compatibility:['CHATGPT']}, {runtime_compatibility:['CHATGPT','CURSOR']}), 'MINOR');
  assert.equal(classifyCanonicalChange({runtime_compatibility:['CHATGPT','CURSOR']}, {runtime_compatibility:['CHATGPT']}), 'MAJOR');
});

test('identical records classify as PATCH for no-op metadata impact', () => {
  assert.equal(classifyCanonicalChange({description:'A'}, {description:'A'}), 'PATCH');
});
