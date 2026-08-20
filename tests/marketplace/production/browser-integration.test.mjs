import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const API='https://fbwoqjxgyczsyjkbglbb.supabase.co/functions/v1/marketplace-api';
const dynamicPages=[
  'my-library/index.html','my-library/owned/index.html','my-library/installed/index.html','my-library/collections/index.html','my-library/updates/index.html','my-library/licenses/index.html',
  'publisher/index.html','publisher/canon/index.html','publisher/candidates/index.html','publisher/products/index.html','publisher/evaluations/index.html','publisher/releases/index.html','publisher/runtime-builds/index.html','publisher/offers/index.html','publisher/analytics/index.html',
  'enterprise/index.html','enterprise/registry/index.html','enterprise/publishers/index.html'
];

test('all dynamic marketplace route shells exist',()=>{
  for(const file of dynamicPages)assert.equal(existsSync(file),true,file);
});

test('shared browser auth targets production using only publishable credentials',()=>{
  const source=readFileSync('assets/marketplace-auth.js','utf8');
  assert.match(source,/supabase-js@2\.112\.3/);
  assert.match(source,new RegExp(API.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(source,/sb_publishable_/);
  assert.match(source,/shouldCreateUser:\s*false/);
  assert.match(source,/Authorization.*Bearer/s);
  assert.match(source,/signInWithOtp/);
  assert.match(source,/signOut/);
  assert.doesNotMatch(source,/service[_-]?role|SUPABASE_SECRET_KEY|sk_live_/i);
});

test('dynamic clients import the shared auth module and use authFetch',()=>{
  for(const file of ['assets/my-library.js','assets/publisher-studio.js','assets/enterprise-registry.js']){
    const source=readFileSync(file,'utf8');
    assert.match(source,/marketplace-auth\.js/,file);
    assert.match(source,/authFetch/,file);
  }
});
