import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRuntimePackagePlan, packagePlanFingerprint } from '../../../marketplace/distribution/package-builder.mjs';

const manifest={product_id:'PRD-1',product_version_id:'PRDV-1',canonical_refs:['SKL-026'],canonical_hashes:['abc'],components:['SKL-026'],license_ref:'LIC-1',provenance_receipt_id:'EVR-1'};

test('runtime package plan is deterministic and contains stable identity',()=>{
  const input={runtime:'CHATGPT',adapter_version:'1.0.0',manifest,canonical_permissions:['READ_REPO'],runtime_permissions:['READ_REPO']};
  const a=buildRuntimePackagePlan(input);const b=buildRuntimePackagePlan(input);
  assert.equal(packagePlanFingerprint(a),packagePlanFingerprint(b));
  assert.equal(a.product_version_id,'PRDV-1');
  assert.equal(a.state,'PLANNED');
  assert.ok(a.files.includes('SKILL.md'));
});

test('unknown runtime is unavailable',()=>assert.equal(buildRuntimePackagePlan({runtime:'NOPE',manifest}).state,'UNAVAILABLE'));
test('package generation rejects authority escalation',()=>assert.throws(()=>buildRuntimePackagePlan({runtime:'CHATGPT',manifest,canonical_permissions:['READ_REPO'],runtime_permissions:['DEPLOY_PROD']}),/RUNTIME_AUTHORITY_ESCALATION/));
