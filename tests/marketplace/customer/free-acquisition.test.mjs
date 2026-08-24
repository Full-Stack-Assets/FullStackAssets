import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createRouter} from '../../../apps/marketplace-api/src/router.mjs';

const servicePath='apps/marketplace-api/src/services/free-acquisition.mjs';

test('router exposes authenticated free acquisition without payment checkout',async()=>{
  let seen=null;
  const router=createRouter({services:{
    auth:{authenticate:async()=>({user:{id:'USR-1'},subject:{type:'USER',id:'USR-1'}})},
    freeAcquisition:{acquire:async(context,input)=>{seen={context,input};return {id:'ENT-1',status:'ACTIVE',product_id:'PRD-1'};}},
  }});
  const response=await router(new Request('https://example.test/v1/acquire/free',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({offerId:'OFF-FREE-1'})}));
  assert.equal(response.status,201);
  assert.deepEqual(await response.json(),{id:'ENT-1',status:'ACTIVE',product_id:'PRD-1'});
  assert.equal(seen.input.offerId,'OFF-FREE-1');
  assert.equal(seen.context.subject.id,'USR-1');
});

test('free acquisition remains authentication gated',async()=>{
  const router=createRouter({services:{auth:{authenticate:async()=>null},freeAcquisition:{acquire:async()=>{throw new Error('must not run');}}}});
  const response=await router(new Request('https://example.test/v1/acquire/free',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}));
  assert.equal(response.status,401);
});

test('free acquisition service is idempotent and rejects non-free offers',async()=>{
  assert.equal(existsSync(servicePath),true,'free acquisition service must exist');
  if(!existsSync(servicePath))return;
  const {createFreeAcquisitionService}=await import('../../../apps/marketplace-api/src/services/free-acquisition.mjs');
  let grants=0;
  const service=createFreeAcquisitionService({
    offerRepository:{getActiveOffer:async(id)=>id==='OFF-PAID'?{id,offer_class:'ONE_TIME',product_id:'PRD-1',license_policy_id:'LIC-1'}:{id,offer_class:'FREE',product_id:'PRD-1',license_policy_id:'LIC-1'}},
    catalogRepository:{getLatestPublishedVersion:async()=>({id:'PV-1',product_id:'PRD-1',version:'1.0.0',publication_state:'PUBLISHED'})},
    entitlementRepository:{
      findActive:async()=>grants?{id:'ENT-1',product_id:'PRD-1',acquired_version:'1.0.0',status:'ACTIVE'}:null,
      grantFree:async(record)=>{grants++;return {id:'ENT-1',...record,status:'ACTIVE'};},
    },
  });
  const context={subject:{type:'USER',id:'USR-1'}};
  const first=await service.acquire(context,{offerId:'OFF-FREE'});
  const second=await service.acquire(context,{offerId:'OFF-FREE'});
  assert.equal(first.id,'ENT-1');
  assert.equal(second.id,'ENT-1');
  assert.equal(grants,1);
  await assert.rejects(()=>service.acquire(context,{offerId:'OFF-PAID'}),error=>error.code==='OFFER_NOT_FREE');
});
