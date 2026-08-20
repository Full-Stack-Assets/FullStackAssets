import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPublicCatalog } from '../../../marketplace/catalog/build-catalog.mjs';

test('reference-only entries have no commerce while paid entries expose only offer summary', () => {
  const catalog = buildPublicCatalog({ entries: [
    { id:'ESP-07', type:'AGENT', slug:'esp-07-security-posture-analyst', commercial_state:'REFERENCE_ONLY', public:true, name:'Security Posture Analyst', security_findings:['secret'] },
    { id:'ESP-02', type:'AGENT', slug:'esp-02-software-implementation-agent', commercial_state:'PAID', public:true, name:'Software Implementation Agent', offer_summary:{currency:'USD', amount:5900, offer_class:'ONE_TIME'}, payout_state:'private' },
  ]});
  const reference=catalog.entries.find((entry)=>entry.id==='ESP-07');
  const paid=catalog.entries.find((entry)=>entry.id==='ESP-02');
  assert.equal(reference.commerce, null);
  assert.equal(paid.commerce.amount, 5900);
  const serialized = JSON.stringify(catalog);
  assert.doesNotMatch(serialized, /secret|payout_state|private evaluator/i);
});

test('private entries never enter the public catalog', () => {
  const catalog = buildPublicCatalog({ entries:[
    { id:'SKL-999', type:'SKILL', slug:'hidden', name:'Hidden', public:false },
  ]});
  assert.equal(catalog.entries.length, 0);
});
