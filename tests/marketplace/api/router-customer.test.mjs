import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouter } from '../../../apps/marketplace-api/src/router.mjs';
const context={user:{id:'USR-A'},subject:{type:'USER',id:'USR-A'},memberships:[],roles:['CUSTOMER']};
function router(authenticated=true){return createRouter({services:{auth:{authenticate:async()=>authenticated?context:null},customerLibrary:{getMe:async()=>({id:'USR-A'}),listLibrary:async()=>[],listUpdates:async()=>[],createInstallation:async()=>({id:'INS-1'}),createCollection:async()=>({id:'COL-1'}),addCollectionItem:async()=>({id:'CI-1'}),download:async()=>({grant:{grant_id:'G-1'}})},catalog:{resolveProductVersion:async()=>({id:'PV-1'})}}});}
test('customer reads require authentication',async()=>{for(const path of ['/v1/me','/v1/library','/v1/library/updates']) assert.equal((await router(false)(new Request(`http://local${path}`))).status,401);});
test('authenticated empty library is isolated',async()=>{const response=await router()(new Request('http://local/v1/library'));assert.equal(response.status,200);assert.deepEqual(await response.json(),[]);});
test('stateful route parses JSON and returns created',async()=>{const response=await router()(new Request('http://local/v1/installations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({product_version_id:'PV-1',runtime:'UNIVERSAL'})}));assert.equal(response.status,201);});
