import test from 'node:test';
import assert from 'node:assert/strict';
import { applyEnterprisePolicy, assertPolicyDoesNotExpand } from '../../../marketplace/enterprise/policy.mjs';

test('enterprise overlay intersects runtimes and removes denied permissions',()=>{
  const canonical={allowed_runtimes:['CHATGPT','CURSOR','GEMINI'],permissions:['READ_REPO','WRITE_DRAFT'],max_risk_tier:'HIGH'};
  const effective=applyEnterprisePolicy({canonical,overlay:{allowed_runtimes:['CHATGPT','GEMINI'],denied_permissions:['WRITE_DRAFT'],max_risk_tier:'MODERATE'}});
  assert.deepEqual(effective.allowed_runtimes,['CHATGPT','GEMINI']);
  assert.deepEqual(effective.permissions,['READ_REPO']);
  assert.equal(effective.max_risk_tier,'MODERATE');
  assert.equal(assertPolicyDoesNotExpand({canonical,effective}),true);
});

test('overlay cannot raise canonical risk ceiling',()=>{
  const effective=applyEnterprisePolicy({canonical:{allowed_runtimes:['CHATGPT'],permissions:[],max_risk_tier:'LOW'},overlay:{max_risk_tier:'RESTRICTED'}});
  assert.equal(effective.max_risk_tier,'LOW');
});

test('explicit expansion assertion rejects extra permissions or runtimes',()=>{
  assert.throws(()=>assertPolicyDoesNotExpand({canonical:{allowed_runtimes:['CHATGPT'],permissions:['READ']},effective:{allowed_runtimes:['CHATGPT','GROK'],permissions:['READ']}}),/ENTERPRISE_POLICY_AUTHORITY_EXPANSION/);
});
