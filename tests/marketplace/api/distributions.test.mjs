import test from 'node:test';
import assert from 'node:assert/strict';
import { createDistributionService } from '../../../apps/marketplace-api/src/services/distributions.mjs';

const repo={
  getProductVersion:async(id)=>id==='PV-1'?{id:'PV-1',required_runtimes:['CHATGPT']}:null,
  listRuntimeDistributions:async()=>[
    {runtime:'CHATGPT',artifact_hash:'abc',security_status:'PASS',dependency_status:'PASS'},
    {runtime:'GEMINI',artifact_hash:'def',security_status:'BLOCKED',dependency_status:'PASS'},
  ],
  listRuntimeEvaluations:async()=>[
    {runtime:'CHATGPT',status:'PASS',provenance_complete:true,critical_failures:0,receipt_id:'EV-CHATGPT',evaluated_at:'2026-08-19T12:00:00Z'},
    {runtime:'GEMINI',status:'PASS',provenance_complete:true,critical_failures:0,receipt_id:'EV-GEMINI',evaluated_at:'2026-08-19T12:00:00Z'},
  ],
};

test('distribution service exposes evidence-backed compatibility without entitlement data',async()=>{
  const service=createDistributionService({repo});
  const result=await service.compatibility({user:{id:'U1'}},'PV-1');
  assert.equal(result.status,'PASS');
  assert.equal(result.compatibility.find((x)=>x.runtime==='CHATGPT').state,'VERIFIED');
  assert.equal(result.compatibility.find((x)=>x.runtime==='GEMINI').state,'BLOCKED');
  assert.equal('entitlement' in result,false);
});

test('missing product version returns null',async()=>assert.equal(await createDistributionService({repo}).compatibility({user:{id:'U1'}},'NOPE'),null));
