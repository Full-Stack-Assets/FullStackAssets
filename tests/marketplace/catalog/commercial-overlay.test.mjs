import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

const path='marketplace/catalog/commercial-overlay.mjs';

test('commercial overlay promotes exactly the first ten without mutating Canon identity fields',async()=>{
  assert.equal(existsSync(path),true,'commercial overlay module must exist');
  if(!existsSync(path))return;
  const {applyCommercialOverlay,firstCohortCommercialOverlay}=await import('../../../marketplace/catalog/commercial-overlay.mjs');
  const {FIRST_COHORT}=await import('../../../marketplace/launch/first-cohort.mjs');
  const cohortEntries=FIRST_COHORT.map((product,index)=>({id:product.product_id,type:product.type,slug:index===0?'original':product.canonical_ref.toLowerCase(),name:index===0?'Canonical Name':product.name,description:index===0?'Canonical description':product.purpose,domain:'D',commercial_state:'REFERENCE_ONLY'}));
  const base={generated_at:null,publishers:[],taxonomy:{domains:['D'],types:['AGENT','SKILL'],commercial_states:['REFERENCE_ONLY']},entries:[...cohortEntries,{id:'PRD-OTHER',type:'SKILL',slug:'other',name:'Other',description:'Other description',domain:'D',commercial_state:'REFERENCE_ONLY'}]};
  const before=structuredClone(base);
  const result=applyCommercialOverlay(base,firstCohortCommercialOverlay());
  assert.deepEqual(base,before,'baseline input must remain immutable');
  assert.equal(result.entries.filter(e=>e.commercial_state==='FREE').length,10);
  const promoted=result.entries.find(e=>e.id==='PRD-0BD1D7BD75AE');
  const untouched=result.entries.find(e=>e.id==='PRD-OTHER');
  assert.equal(promoted.name,'Canonical Name');
  assert.equal(promoted.slug,'original');
  assert.equal(promoted.description,'Canonical description');
  assert.equal(promoted.commercial_state,'FREE');
  assert.equal(promoted.offer_summary.offer_class,'FREE');
  assert.equal(promoted.offer_summary.amount,0);
  assert.equal(promoted.version_summary.current,'1.0.0');
  assert.equal(promoted.compatibility.filter(x=>x.state==='VERIFIED').length,1);
  assert.equal(promoted.compatibility.find(x=>x.runtime==='UNIVERSAL').package_available,true);
  assert.equal(untouched.commercial_state,'REFERENCE_ONLY');
  assert.deepEqual(result.taxonomy.commercial_states,['FREE','REFERENCE_ONLY']);
});

test('overlay refuses unknown product IDs and Canon identity changes',async()=>{
  assert.equal(existsSync(path),true,'commercial overlay module must exist');
  if(!existsSync(path))return;
  const {applyCommercialOverlay}=await import('../../../marketplace/catalog/commercial-overlay.mjs');
  const base={entries:[{id:'PRD-1',type:'SKILL',slug:'s',name:'N',commercial_state:'REFERENCE_ONLY'}],publishers:[],taxonomy:{}};
  assert.throws(()=>applyCommercialOverlay(base,{entries:{'PRD-X':{commercial_state:'FREE'}}}),/OVERLAY_UNKNOWN_PRODUCT/);
  assert.throws(()=>applyCommercialOverlay(base,{entries:{'PRD-1':{name:'Changed'}}}),/OVERLAY_FIELD_NOT_ALLOWED/);
});
