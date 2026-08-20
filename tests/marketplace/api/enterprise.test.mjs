import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnterpriseService } from '../../../apps/marketplace-api/src/services/enterprise.mjs';

const repo={
  getRegistry:async(id)=>id==='REG-A'?{id:'REG-A',organization_id:'ORG-A',name:'A Registry',status:'ACTIVE'}:id==='REG-B'?{id:'REG-B',organization_id:'ORG-B',name:'B Registry',status:'ACTIVE'}:null,
  listRegistryProducts:async(id)=>id==='REG-A'?[{id:'E1',registry_id:'REG-A',product_id:'P1',product_version_id:'PV1',visibility:'ORG_ONLY',version_policy:'EXACT'}]:[],
  getProduct:async(id)=>({id,title:'Private Product'}),
  getCanonicalOrganizationPolicy:async()=>({allowed_runtimes:['CHATGPT','CURSOR'],permissions:['READ_REPO','WRITE_DRAFT'],max_risk_tier:'HIGH'}),
  getEnterprisePolicyOverlay:async()=>({allowed_runtimes:['CHATGPT'],denied_permissions:['WRITE_DRAFT'],max_risk_tier:'MODERATE'}),
};
const orgA={user:{id:'U1'},memberships:[{organization_id:'ORG-A',status:'ACTIVE',app_role:'ORG_MEMBER'}]};

test('enterprise member reads only own private registry',async()=>{
  const service=createEnterpriseService({repo});
  const result=await service.registry(orgA,'REG-A');assert.equal(result.entries.length,1);assert.equal(result.entries[0].product_id,'P1');
  await assert.rejects(()=>service.registry(orgA,'REG-B'),/FORBIDDEN/);
});

test('enterprise effective policy is narrower than canonical policy',async()=>{
  const result=await createEnterpriseService({repo}).policy(orgA,'ORG-A');
  assert.deepEqual(result.effective.allowed_runtimes,['CHATGPT']);
  assert.deepEqual(result.effective.permissions,['READ_REPO']);
  assert.equal(result.effective.max_risk_tier,'MODERATE');
});
