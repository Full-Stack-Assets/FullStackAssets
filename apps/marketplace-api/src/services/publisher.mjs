import {requireAppRole} from '../auth/authorize.mjs';
function deny(){throw Object.assign(new Error('FORBIDDEN'),{status:403,code:'FORBIDDEN'});}
export function createPublisherService({repo,idFactory=()=>crypto.randomUUID()}={}){function scope(context,publisherId='PUB-001'){requireAppRole(context,['PUBLISHER_MEMBER','PUBLISHER_ADMIN','REVIEWER']);if(!(context.publisher_memberships??[]).some(m=>m.publisher_id===publisherId&&m.status!=='REVOKED'))deny();return publisherId;}return{
 async listCanon(context){const p=scope(context);return repo.listPublisherCanon(p);},
 async listCandidates(context){const p=scope(context);return repo.listCandidates(p);},
 async getProduct(context,id){const p=scope(context);const x=await repo.getPublisherProduct(p,id);if(!x)deny();return x;},
 async createOffer(context,id,input){const p=scope(context);const x=await repo.getPublisherProduct(p,id);if(!x)deny();const out=await repo.createOffer({...input,id:input.id??`OFF-${idFactory()}`,product_id:id});await repo.audit?.({publisher_id:p,actor_id:context.user.id,object_ref:id,action:'CREATE_OFFER',result:'SUCCESS',correlation_id:input.correlation_id??idFactory()});return out;},
 async submitEvaluation(context,id,input){const p=scope(context);if(!await repo.getPublisherProduct(p,id))deny();return repo.createEvaluation({...input,id:input.id??`EV-${idFactory()}`,product_id:id});},
 async requestRuntimeBuild(context,id,input){const p=scope(context);if(!await repo.getPublisherProduct(p,id))deny();return repo.createRuntimeBuild({publisher_id:p,product_id:id,...input});},
 async requestPublicationReview(context,id,input){const p=scope(context);if(!await repo.getPublisherProduct(p,id))deny();return repo.createPublicationReview({id:`REV-${idFactory()}`,publisher_id:p,product_id:id,...input,status:'PENDING'});},
 async approve(context,reviewId,input){scope(context,input.publisher_id??'PUB-001');requireAppRole(context,['REVIEWER']);if(!context.human_authority)deny();return repo.approveReview(reviewId,{reviewer_id:context.user.id,expected_version_hash:input.expected_version_hash});},
 async proposeCanonChange(context,input){const p=scope(context);return repo.createCanonProposal({id:`CP-${idFactory()}`,publisher_id:p,canonical_ref:input.canonical_ref,proposed_patch:input.proposed_patch,status:'SUBMITTED',created_by:context.user.id});}
};}
