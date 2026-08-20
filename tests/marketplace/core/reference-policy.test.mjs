import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_REFERENCE_FIELDS, referenceVisibilityDecision, projectPublicReference } from '../../../marketplace/core/reference-policy.mjs';

test('private fields are excluded from public reference projection', () => {
  const entity = {
    id:'ESP-02', status:'APPROVED', provenance_complete:true,
    name:'Software Implementation Agent', description:'Builds approved software', domain:'Engineering',
    risk_tier:'MODERATE', skill_ids:['SKL-026'], integration_ids:['INT-007'],
    security_findings:['secret'], private_fields:{security_findings:['secret']},
  };
  const decision = referenceVisibilityDecision(entity);
  assert.equal(decision.public, true);
  assert.ok(!decision.fields.includes('security_findings'));
  const projected = projectPublicReference(entity);
  assert.equal(projected.name, 'Software Implementation Agent');
  assert.equal('security_findings' in projected, false);
  assert.deepEqual(Object.keys(projected).sort(), decision.fields.slice().sort());
});

test('restricted public metadata classification blocks projection', () => {
  const decision = referenceVisibilityDecision({
    id:'ESP-02', status:'APPROVED', provenance_complete:true,
    public_metadata_classification:'RESTRICTED', name:'Hidden',
  });
  assert.deepEqual(decision, { public:false, fields:[], reasons:['PUBLIC_METADATA_RESTRICTED'] });
});

test('incomplete provenance blocks public reference projection', () => {
  const decision = referenceVisibilityDecision({id:'SKL-026', status:'APPROVED', provenance_complete:false, name:'Secure Implementation'});
  assert.deepEqual(decision, { public:false, fields:[], reasons:['PROVENANCE_INCOMPLETE'] });
});

test('projection uses an explicit allowlist', () => {
  assert.ok(PUBLIC_REFERENCE_FIELDS.includes('id'));
  assert.ok(PUBLIC_REFERENCE_FIELDS.includes('name'));
  assert.ok(PUBLIC_REFERENCE_FIELDS.includes('skill_ids'));
  assert.equal(PUBLIC_REFERENCE_FIELDS.includes('private_fields'), false);
  assert.equal(PUBLIC_REFERENCE_FIELDS.includes('security_findings'), false);
});
