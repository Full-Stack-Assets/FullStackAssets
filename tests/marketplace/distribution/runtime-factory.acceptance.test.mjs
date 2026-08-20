import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRuntimePackagePlan } from '../../../marketplace/distribution/package-builder.mjs';
import { buildEvaluationMatrix } from '../../../marketplace/distribution/evaluation-matrix.mjs';

const manifest={product_id:'PRD-1',product_version_id:'PV-1',canonical_refs:['SKL-026'],canonical_hashes:['canon-hash'],components:['SKL-026'],license_ref:'LIC-1',provenance_receipt_id:'EVR-1'};

test('one runtime can fail while another remains verified and universal package remains valid',()=>{
  const universal=buildRuntimePackagePlan({runtime:'UNIVERSAL',manifest,canonical_permissions:['READ_REPO'],runtime_permissions:['READ_REPO']});
  const chatgpt=buildRuntimePackagePlan({runtime:'CHATGPT',manifest,canonical_permissions:['READ_REPO'],runtime_permissions:['READ_REPO']});
  assert.equal(universal.state,'PLANNED');assert.equal(chatgpt.state,'PLANNED');
  const matrix=buildEvaluationMatrix({distributions:[
    {runtime:'CHATGPT',artifact_hash:'chat-hash',security_status:'PASS',dependency_status:'PASS'},
    {runtime:'GEMINI',artifact_hash:'gem-hash',security_status:'BLOCKED',dependency_status:'PASS'},
  ],evaluations:[
    {runtime:'CHATGPT',status:'PASS',provenance_complete:true,critical_failures:0,receipt_id:'EV-C',evaluated_at:'2026-08-19T12:00:00Z'},
    {runtime:'GEMINI',status:'PASS',provenance_complete:true,critical_failures:0,receipt_id:'EV-G',evaluated_at:'2026-08-19T12:00:00Z'},
  ]});
  assert.equal(matrix.rows.find((r)=>r.runtime==='CHATGPT').state,'VERIFIED');
  assert.equal(matrix.rows.find((r)=>r.runtime==='GEMINI').state,'BLOCKED');
  assert.equal(matrix.status,'PASS');
});

test('runtime adapter cannot enlarge canonical permission surface',()=>{
  assert.throws(()=>buildRuntimePackagePlan({runtime:'CURSOR',manifest,canonical_permissions:['READ_REPO'],runtime_permissions:['READ_REPO','WRITE_PRODUCTION']}),/RUNTIME_AUTHORITY_ESCALATION/);
});
