import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionVersion } from '../../../marketplace/core/state-machine.mjs';
import { publicationDecision } from '../../../marketplace/core/publication-policy.mjs';

test('low-risk free validated patch may auto-publish', () => {
  assert.deepEqual(publicationDecision({
    risk_tier:'LOW', commercial_state:'FREE', change_severity:'PATCH',
    provenance_complete:true, rights_known:true, evaluation_passed:true,
    new_authority:false, publisher_auto_eligible:true,
  }), { decision:'AUTO', reasons:[] });
});

test('paid high-risk major authority change requires human review', () => {
  const result = publicationDecision({
    risk_tier:'HIGH', commercial_state:'PAID', change_severity:'MAJOR',
    provenance_complete:true, rights_known:true, evaluation_passed:true,
    new_authority:true, publisher_auto_eligible:true,
  });
  assert.equal(result.decision, 'HUMAN_REVIEW');
  assert.ok(result.reasons.includes('PAID_ACTIVATION_REQUIRES_HUMAN'));
  assert.ok(result.reasons.includes('HIGH_RISK_REQUIRES_HUMAN'));
  assert.ok(result.reasons.includes('MAJOR_CHANGE_REQUIRES_HUMAN'));
  assert.ok(result.reasons.includes('NEW_AUTHORITY_REQUIRES_HUMAN'));
});

test('missing provenance or failed evaluation blocks publication', () => {
  const provenance = publicationDecision({risk_tier:'LOW', commercial_state:'FREE', change_severity:'PATCH', provenance_complete:false, rights_known:true, evaluation_passed:true, new_authority:false, publisher_auto_eligible:true});
  assert.deepEqual(provenance, {decision:'BLOCK', reasons:['PROVENANCE_INCOMPLETE']});
  const evalFail = publicationDecision({risk_tier:'LOW', commercial_state:'FREE', change_severity:'PATCH', provenance_complete:true, rights_known:true, evaluation_passed:false, new_authority:false, publisher_auto_eligible:true});
  assert.deepEqual(evalFail, {decision:'BLOCK', reasons:['EVALUATION_FAILED']});
});

test('new I3/I4 authority, sensitive data, and policy exceptions require human review', () => {
  const result = publicationDecision({
    risk_tier:'LOW', commercial_state:'FREE', change_severity:'MINOR', provenance_complete:true,
    rights_known:true, evaluation_passed:true, new_authority:false, permission_tier:'I4',
    sensitive_data_change:true, policy_exception:true, publisher_auto_eligible:true,
  });
  assert.equal(result.decision, 'HUMAN_REVIEW');
  assert.ok(result.reasons.includes('I4_REQUIRES_HUMAN'));
  assert.ok(result.reasons.includes('SENSITIVE_DATA_CHANGE_REQUIRES_HUMAN'));
  assert.ok(result.reasons.includes('POLICY_EXCEPTION_REQUIRES_HUMAN'));
});

test('publication state machine allows forward flow and rejects regression', () => {
  assert.equal(transitionVersion('DRAFT','VALIDATING'), 'VALIDATING');
  assert.equal(transitionVersion('VALIDATING','EVALUATING'), 'EVALUATING');
  assert.equal(transitionVersion('EVALUATING','COMMERCIAL_READY'), 'COMMERCIAL_READY');
  assert.equal(transitionVersion('COMMERCIAL_READY','PUBLICATION_REVIEW'), 'PUBLICATION_REVIEW');
  assert.equal(transitionVersion('PUBLICATION_REVIEW','PUBLISHED'), 'PUBLISHED');
  assert.throws(() => transitionVersion('PUBLISHED','DRAFT'), /INVALID_VERSION_TRANSITION/);
});

test('published versions may only move to superseded, retired, or suspension states', () => {
  assert.equal(transitionVersion('PUBLISHED','SUPERSEDED'), 'SUPERSEDED');
  assert.equal(transitionVersion('PUBLISHED','SUSPENDED'), 'SUSPENDED');
  assert.equal(transitionVersion('PUBLISHED','SECURITY_BLOCKED'), 'SECURITY_BLOCKED');
});
