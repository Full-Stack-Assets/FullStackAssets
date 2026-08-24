import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {renderEntry} from '../../../marketplace/catalog/render.mjs';

test('free product detail exposes a real authenticated Add to Library action',()=>{
  const html=renderEntry({id:'SKL-001',type:'SKILL',slug:'skl-001',name:'Structured Intake Normalization',description:'Normalize input',commercial_state:'FREE',commerce:{state:'FREE',offer_class:'FREE',amount:0,currency:'USD',offer_id:'OFF-FIRST10-SKL-001'},compatibility:[{runtime:'UNIVERSAL',state:'VERIFIED',package_available:true}]});
  assert.match(html,/data-free-acquire/);
  assert.match(html,/data-offer-id="OFF-FIRST10-SKL-001"/);
  assert.match(html,/\/assets\/library-acquire\.js/);
  assert.match(html,/href="\/my-library\/"[^>]*>Install/);
});

test('reference-only product never exposes free acquisition',()=>{
  const html=renderEntry({id:'SKL-999',type:'SKILL',slug:'skl-999',name:'Reference',commercial_state:'REFERENCE_ONLY'});
  assert.doesNotMatch(html,/data-free-acquire|library-acquire\.js/);
});

test('browser acquisition client uses shared Supabase auth and free endpoint only',()=>{
  assert.equal(existsSync('assets/library-acquire.js'),true,'free acquisition browser client must exist');
  if(!existsSync('assets/library-acquire.js'))return;
  const source=readFileSync('assets/library-acquire.js','utf8');
  assert.match(source,/marketplace-auth\.js/);
  assert.match(source,/authFetch/);
  assert.match(source,/\/v1\/acquire\/free/);
  assert.match(source,/method:\s*['"]POST['"]/);
  assert.match(source,/\/my-library\//);
  assert.doesNotMatch(source,/\/v1\/checkout|stripe/i);
});
