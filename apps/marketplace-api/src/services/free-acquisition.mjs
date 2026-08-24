function problem(message,{status=400,code='BAD_REQUEST'}={}){return Object.assign(new Error(message),{status,code});}
export function createFreeAcquisitionService({offerRepository,catalogRepository,entitlementRepository}={}){
  if(!offerRepository||!catalogRepository||!entitlementRepository)throw new TypeError('FREE_ACQUISITION_DEPENDENCIES_REQUIRED');
  return Object.freeze({
    async acquire(context,{offerId}={}){
      const subject=context?.subject;
      if(!subject?.id||!['USER','ORGANIZATION'].includes(subject.type))throw problem('Unauthorized',{status:401,code:'UNAUTHORIZED'});
      if(!offerId)throw problem('offerId is required',{status:400,code:'OFFER_ID_REQUIRED'});
      const offer=await offerRepository.getActiveOffer(offerId);
      if(!offer)throw problem('Offer not available',{status:404,code:'OFFER_NOT_AVAILABLE'});
      if(offer.offer_class!=='FREE'||Number(offer.amount_minor??0)!==0)throw problem('Offer is not free',{status:409,code:'OFFER_NOT_FREE'});
      const version=await catalogRepository.getLatestPublishedVersion(offer.product_id);
      if(!version||version.publication_state!=='PUBLISHED')throw problem('Published version unavailable',{status:409,code:'PUBLISHED_VERSION_UNAVAILABLE'});
      const existing=await entitlementRepository.findActive(subject,offer.product_id);
      if(existing)return existing;
      return entitlementRepository.grantFree({subject,product_id:offer.product_id,license_policy_id:offer.license_policy_id,acquired_version:version.version,version_policy:'CURRENT_WHILE_ACTIVE',allowed_runtimes:['UNIVERSAL','CHATGPT','CURSOR','GEMINI','GROK','MANUS','MCP']});
    },
  });
}
