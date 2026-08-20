import test from 'node:test';
import assert from 'node:assert/strict';
import { applyEnterprisePolicy, assertPolicyDoesNotExpand } from '../../../marketplace/enterprise/policy.mjs';
import { assertNoCanonicalFork, projectPrivateRegistry } from '../../../marketplace/enterprise/private-registry.mjs';
import { derivePublisherVerification, assertPublisherActivationAllowed } from '../../../marketplace/publisher/verification.mjs';
import { buildLaunchEvidence, REQUIRED_UNITS, ENTERPRISE_GATES } from '../../../marketplace/launch/evidence.mjs';
import { REQUIRED_GATES } from '../../../marketplace/release/gates.mjs';

test('enterprise restrictions, private isolation, publisher gating, and launch evidence compose safely',()=>{
  const canonical={allowed_runtimes:['CHATGPT','CURSOR','GEMINI'],permissions:['READ_REPO','WRITE_DRAFT'],max_risk_tier:'HIGH'};
  const effective=applyEnterprisePolicy({canonical,overlay:{allowed_runtimes:['CHATGPT'],denied_permissions:['WRITE_DRAFT'],max_risk_tier:'MODERATE'}});
  assert.equal(assertPolicyDoesNotExpand({canonical,effective}),true);
  assert.deepEqual(effective.permissions,['READ_REPO']);
  assertNoCanonicalFork({product_id:'P1',product_version_id:'PV1'});
  const registry={id:'R1',organization_id:'ORG-A'};
  const entries=[{id:'E1',registry_id:'R1',product_id:'P1',visibility:'ORG_ONLY',version_policy:'EXACT'}];
  assert.equal(projectPrivateRegistry({context:{memberships:[{organization_id:'ORG-A',status:'ACTIVE',app_role:'ORG_MEMBER'}]},registry,entries,productsById:new Map([['P1',{id:'P1'}]])}).length,1);
  assert.throws(()=>projectPrivateRegistry({context:{memberships:[{organization_id:'ORG-B',status:'ACTIVE',app_role:'ORG_ADMIN'}]},registry,entries,productsById:new Map()}),/FORBIDDEN/);
  const verification=derivePublisherVerification({publisher:{id:'PUB-2',type:'VERIFIED_THIRD_PARTY'},evidence:{identity_verified:true,provenance_verified:true,policy_version:'1.0'},humanDecision:{approved:true,reviewer_id:'HUMAN-1'}});
  assert.throws(()=>assertPublisherActivationAllowed({verification,humanAuthority:false}),/HUMAN_AUTHORITY/);
  assert.equal(assertPublisherActivationAllowed({verification,humanAuthority:true}),true);
  const units=Object.fromEntries(REQUIRED_UNITS.map((u)=>[u,{status:'PASS',receipt_id:`UNIT-${u}`} ]));
  const gates=Object.fromEntries(REQUIRED_GATES.map((g)=>[g,'PASS']));
  const enterpriseGates=Object.fromEntries(ENTERPRISE_GATES.map((g)=>[g,'PASS']));
  assert.equal(buildLaunchEvidence({unitReceipts:units,releaseGates:gates,enterpriseGates}).status,'PASS');
});

test('launch remains blocked if Unit 8 evidence is absent even when prior release gates pass',()=>{
  const units=Object.fromEntries(REQUIRED_UNITS.map((u)=>[u,{status:u===8?'UNKNOWN':'PASS'}]));
  const gates=Object.fromEntries(REQUIRED_GATES.map((g)=>[g,'PASS']));
  const enterpriseGates=Object.fromEntries(ENTERPRISE_GATES.map((g)=>[g,'PASS']));
  assert.equal(buildLaunchEvidence({unitReceipts:units,releaseGates:gates,enterpriseGates}).status,'BLOCK');
});
