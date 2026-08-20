import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLaunchEvidence, assertLaunchEvidenceComplete, REQUIRED_UNITS, ENTERPRISE_GATES } from '../../../marketplace/launch/evidence.mjs';
import { REQUIRED_GATES } from '../../../marketplace/release/gates.mjs';

const units=Object.fromEntries(REQUIRED_UNITS.map((u)=>[u,{status:'PASS',receipt_id:`UNIT-${u}`} ]));
const gates=Object.fromEntries(REQUIRED_GATES.map((g)=>[g,'PASS']));
const enterprise=Object.fromEntries(ENTERPRISE_GATES.map((g)=>[g,'PASS']));

test('launch evidence passes only with all unit receipts and all gates',()=>{
  const bundle=buildLaunchEvidence({unitReceipts:units,releaseGates:gates,enterpriseGates:enterprise});
  assert.equal(bundle.status,'PASS');assert.equal(bundle.evidence_complete,true);assert.equal(assertLaunchEvidenceComplete(bundle),true);
});

test('missing unit, enterprise gate, or unresolved critical finding blocks launch',()=>{
  const missing={...units,8:{status:'UNKNOWN'}};
  assert.equal(buildLaunchEvidence({unitReceipts:missing,releaseGates:gates,enterpriseGates:enterprise}).status,'BLOCK');
  assert.equal(buildLaunchEvidence({unitReceipts:units,releaseGates:gates,enterpriseGates:{...enterprise,ENTERPRISE_ISOLATION:'FAIL'}}).status,'BLOCK');
  assert.equal(buildLaunchEvidence({unitReceipts:units,releaseGates:gates,enterpriseGates:enterprise,criticalFindings:[{severity:'CRITICAL',resolved:false}]}).status,'BLOCK');
});

test('UNKNOWN is never coerced to PASS',()=>{
  const bad={...gates,SECURITY_SCAN:'UNKNOWN'};
  const bundle=buildLaunchEvidence({unitReceipts:units,releaseGates:bad,enterpriseGates:enterprise});
  assert.equal(bundle.status,'BLOCK');assert.throws(()=>assertLaunchEvidenceComplete(bundle),/EVIDENCE_INCOMPLETE/);
});
