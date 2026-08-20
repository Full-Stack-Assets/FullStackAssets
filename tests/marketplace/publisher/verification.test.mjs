import test from 'node:test';
import assert from 'node:assert/strict';
import { derivePublisherVerification, publisherMayPublish, assertPublisherActivationAllowed } from '../../../marketplace/publisher/verification.mjs';

test('third-party publisher advances only through evidence and human review',()=>{
  const publisher={id:'PUB-2',type:'VERIFIED_THIRD_PARTY'};
  assert.equal(derivePublisherVerification({publisher,evidence:{}}).state,'NEW');
  assert.equal(derivePublisherVerification({publisher,evidence:{identity_verified:true}}).state,'IDENTITY_VERIFIED');
  assert.equal(derivePublisherVerification({publisher,evidence:{identity_verified:true,provenance_verified:true}}).state,'PROVENANCE_VERIFIED');
  const review=derivePublisherVerification({publisher,evidence:{identity_verified:true,provenance_verified:true,policy_version:'1.0'}});
  assert.equal(review.state,'HUMAN_REVIEW');
  const verified=derivePublisherVerification({publisher,evidence:{identity_verified:true,provenance_verified:true,policy_version:'1.0'},humanDecision:{approved:true,reviewer_id:'HUMAN-1'}});
  assert.equal(verified.state,'VERIFIED');assert.equal(publisherMayPublish(verified),true);
});

test('first-party trust is explicit, not name-derived',()=>{
  assert.equal(derivePublisherVerification({publisher:{id:'PUB-1',type:'FIRST_PARTY'}}).state,'VERIFIED');
  assert.notEqual(derivePublisherVerification({publisher:{id:'PUB-X',type:'VERIFIED_THIRD_PARTY',name:'Full Stack Assets'},evidence:{}}).state,'VERIFIED');
});

test('publisher activation still requires live human authority',()=>{
  const verification={state:'VERIFIED'};
  assert.throws(()=>assertPublisherActivationAllowed({verification,humanAuthority:false}),/HUMAN_AUTHORITY/);
  assert.equal(assertPublisherActivationAllowed({verification,humanAuthority:true}),true);
});
