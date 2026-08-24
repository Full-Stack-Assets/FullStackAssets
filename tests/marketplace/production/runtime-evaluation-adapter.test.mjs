import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateRuntimeCompatibility} from '../../../marketplace/distribution/compatibility.mjs';
import {runtimeAdapter} from '../../../marketplace/distribution/adapters.mjs';

test('persisted VERIFIED evaluation shape maps to verified runtime evidence',()=>{
  const result=evaluateRuntimeCompatibility({
    adapter:runtimeAdapter('UNIVERSAL'),
    distribution:{artifact_hash:'a'.repeat(64)},
    evaluation:{
      compatibility_result:'VERIFIED',
      provenance_complete:true,
      created_at:'2026-08-24T12:00:00.000Z',
      evidence_receipt_id:'EVID-FIRST10-SKL-001-UNIVERSAL',
      policy_failures:[],
    },
    now:new Date('2026-08-24T12:01:00.000Z'),
  });
  assert.equal(result.state,'VERIFIED');
  assert.equal(result.reason,'EVIDENCE_COMPLETE');
  assert.equal(result.evaluation_receipt_id,'EVID-FIRST10-SKL-001-UNIVERSAL');
});

test('persisted EXPERIMENTAL evaluation shape remains experimental',()=>{
  const result=evaluateRuntimeCompatibility({
    adapter:runtimeAdapter('CHATGPT'),
    distribution:{artifact_hash:'b'.repeat(64)},
    evaluation:{
      compatibility_result:'EXPERIMENTAL',
      provenance_complete:true,
      created_at:'2026-08-24T12:00:00.000Z',
      evidence_receipt_id:'EVID-FIRST10-SKL-001-CHATGPT',
      policy_failures:[],
    },
  });
  assert.equal(result.state,'EXPERIMENTAL');
  assert.equal(result.reason,'EVALUATION_INCOMPLETE');
});
