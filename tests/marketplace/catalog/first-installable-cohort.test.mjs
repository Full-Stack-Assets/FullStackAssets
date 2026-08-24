import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

const cohortPath='marketplace/launch/first-cohort.mjs';
const expected=['SKL-001','SKL-002','SKL-006','SKL-013','SKL-045','GKE-06','PXD-02','ESP-03','ESP-09','RCP-04'].sort();

test('first cohort is exactly ten approved low/moderate-risk Canon products',async()=>{
  assert.equal(existsSync(cohortPath),true,'first cohort manifest must exist');
  if(!existsSync(cohortPath))return;
  const {FIRST_COHORT}=await import('../../../marketplace/launch/first-cohort.mjs');
  assert.equal(FIRST_COHORT.length,10);
  assert.deepEqual(FIRST_COHORT.map(x=>x.canonical_ref).sort(),expected);
  assert.equal(FIRST_COHORT.filter(x=>x.type==='SKILL').length,5);
  assert.equal(FIRST_COHORT.filter(x=>x.type==='AGENT').length,5);
  for(const item of FIRST_COHORT){
    assert.match(item.risk_tier,/^(LOW|MODERATE)$/);
    assert.equal(item.default_integration_tier,'I0');
    assert.equal(item.version,'1.0.0');
    assert.equal(item.offer_class,'FREE');
    assert.equal(item.license_class,'FREE_COMMERCIAL');
    assert.deepEqual(item.runtimes,['UNIVERSAL','CHATGPT','CURSOR','GEMINI','GROK','MANUS','MCP']);
    assert.equal(item.runtime_states.UNIVERSAL,'VERIFIED');
    for(const runtime of item.runtimes.filter(r=>r!=='UNIVERSAL'))assert.equal(item.runtime_states[runtime],'EXPERIMENTAL');
    assert.equal(item.selection_scores.length,6);
    assert.ok(item.selection_scores.every(n=>Number.isInteger(n)&&n>=1&&n<=5));
  }
});

test('cohort package factory produces authority-monotonic runtime plans',async()=>{
  assert.equal(existsSync(cohortPath),true,'first cohort manifest must exist');
  if(!existsSync(cohortPath))return;
  const {FIRST_COHORT,buildCohortPackagePlans}=await import('../../../marketplace/launch/first-cohort.mjs');
  const plans=buildCohortPackagePlans();
  assert.equal(plans.length,70);
  assert.equal(plans.filter(p=>p.runtime==='UNIVERSAL'&&p.state==='PLANNED').length,10);
  assert.ok(plans.every(p=>p.permissions.length===0));
  assert.deepEqual(new Set(plans.map(p=>p.product_id)),new Set(FIRST_COHORT.map(p=>p.product_id)));
});
