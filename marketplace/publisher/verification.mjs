export const PUBLISHER_VERIFICATION_STATES=Object.freeze(['NEW','IDENTITY_VERIFIED','PROVENANCE_VERIFIED','POLICY_ACCEPTED','HUMAN_REVIEW','VERIFIED','SUSPENDED','REJECTED']);

export function derivePublisherVerification({publisher,evidence={},humanDecision=null}={}){
  if(publisher?.type==='FIRST_PARTY') return Object.freeze({state:'VERIFIED',reason:'FIRST_PARTY_DECLARED'});
  if(evidence.identity_verified!==true) return Object.freeze({state:'NEW',reason:'IDENTITY_REQUIRED'});
  if(evidence.provenance_verified!==true) return Object.freeze({state:'IDENTITY_VERIFIED',reason:'PROVENANCE_REQUIRED'});
  if(!evidence.policy_version) return Object.freeze({state:'PROVENANCE_VERIFIED',reason:'POLICY_ACCEPTANCE_REQUIRED'});
  if(humanDecision===null) return Object.freeze({state:'HUMAN_REVIEW',reason:'HUMAN_AUTHORITY_REQUIRED'});
  if(humanDecision.approved!==true) return Object.freeze({state:'REJECTED',reason:String(humanDecision.reason??'HUMAN_REJECTED')});
  if(!humanDecision.reviewer_id) throw new TypeError('PUBLISHER_REVIEWER_REQUIRED');
  return Object.freeze({state:'VERIFIED',reason:'HUMAN_APPROVED',reviewer_id:humanDecision.reviewer_id,policy_version:evidence.policy_version});
}

export function publisherMayPublish(verification){return verification?.state==='VERIFIED';}
export function assertPublisherActivationAllowed({verification,humanAuthority=false}={}){
  if(verification?.state!=='VERIFIED'||humanAuthority!==true){const e=new Error('PUBLISHER_ACTIVATION_REQUIRES_HUMAN_AUTHORITY');e.code='PUBLISHER_ACTIVATION_REQUIRES_HUMAN_AUTHORITY';throw e;}
  return true;
}
