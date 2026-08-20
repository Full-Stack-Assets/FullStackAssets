import test from 'node:test';
import assert from 'node:assert/strict';
import { createCustomerLibraryService } from '../../../apps/marketplace-api/src/services/customer-library.mjs';

function context(id,roles=['CUSTOMER'],memberships=[]){
  return {user:{id},subject:{type:'USER',id},roles,memberships};
}
function harness(){
  let reads=0,writes=0;
  const repo={
    listEntitlements:async(subject)=>{reads++;return [{id:`ENT-${subject.id}`,status:'ACTIVE',product_id:'PRD-1',user_id:subject.type==='USER'?subject.id:null,organization_id:subject.type==='ORGANIZATION'?subject.id:null}];},
    listInstallations:async()=>[],
    createCollection:async(record)=>{writes++;return record;},
  };
  const service=createCustomerLibraryService({customerRepository:repo,catalogRepository:{getProduct:async()=>({id:'PRD-1'})},downloadService:{authorizeDownload:async()=>({})}});
  return {service,counts:()=>({reads,writes})};
}

test('cross-subject access fails closed without mutation; only org admin may select org scope',async()=>{
  const forbiddenContexts=[
    context('USR-A'),
    context('USR-B'),
    context('USR-P',['PUBLISHER_MEMBER']),
    context('USR-M',['CUSTOMER'],[{organization_id:'ORG-A',app_role:'ORG_MEMBER',status:'ACTIVE'}]),
  ];
  for(const ctx of forbiddenContexts){
    const h=harness();
    await assert.rejects(()=>h.service.listLibrary(ctx,{organizationId:'ORG-A'}),/authorized|FORBIDDEN/i);
    assert.deepEqual(h.counts(),{reads:0,writes:0});
  }

  const admin=context('USR-A',['CUSTOMER'],[{organization_id:'ORG-A',app_role:'ORG_ADMIN',status:'ACTIVE'}]);
  const h=harness();
  assert.equal((await h.service.listLibrary(admin,{organizationId:'ORG-A'})).length,1);
  assert.deepEqual(h.counts(),{reads:1,writes:0});
  await assert.rejects(()=>h.service.listLibrary(admin,{organizationId:'ORG-B'}),/authorized|FORBIDDEN/i);
  assert.deepEqual(h.counts(),{reads:1,writes:0});
});
