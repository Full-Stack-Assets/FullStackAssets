import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const REGISTRY='https://full-stack-assets-capability-registry-67wmz3.v2.appdeploy.ai/';
const CATALOG_SHA='2356ac66d862650276f8f0ef02183fa3aa3e9324e7f739cd1d2f548c6fa8bd15';
const read=(path)=>readFileSync(path,'utf8');

test('production deployment receipt documents static and dynamic boundaries',()=>{
  assert.equal(existsSync('docs/marketplace/PRODUCTION_DEPLOYMENT.md'),true);
  const doc=read('docs/marketplace/PRODUCTION_DEPLOYMENT.md');
  assert.match(doc,new RegExp(REGISTRY.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(doc,new RegExp(CATALOG_SHA));
  assert.match(doc,/GitHub Pages/i);
  assert.match(doc,/AppDeploy/i);
  assert.match(doc,/REFERENCE_ONLY/);
  assert.match(doc,/DISABLED_NO_ACTIVE_OFFERS/);
});

test('checked-in AppDeploy adapter matches the production contract',()=>{
  for(const path of ['deploy/appdeploy/marketplace/backend/index.ts','deploy/appdeploy/marketplace/src/main.ts','deploy/appdeploy/marketplace/tests/tests.txt','deploy/appdeploy/marketplace/README.md'])assert.equal(existsSync(path),true,path);
  const backend=read('deploy/appdeploy/marketplace/backend/index.ts');
  assert.match(backend,new RegExp(CATALOG_SHA));
  assert.match(backend,/REFERENCE_ONLY/);
  assert.match(backend,/requireAuth/);
  assert.match(backend,/owner_user_id/);
});

test('static private surfaces route users to the live authenticated registry',()=>{
  for(const path of ['assets/my-library.js','assets/enterprise-registry.js'])assert.match(read(path),new RegExp(REGISTRY.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('production legal pages exist and describe authentication and stored registry data',()=>{
  for(const path of ['legal/privacy/index.html','legal/terms/index.html'])assert.equal(existsSync(path),true,path);
  assert.match(read('legal/privacy/index.html'),/authentication/i);
  assert.match(read('legal/privacy/index.html'),/registry/i);
  assert.match(read('legal/terms/index.html'),/reference/i);
  assert.match(read('legal/terms/index.html'),/authority/i);
});
