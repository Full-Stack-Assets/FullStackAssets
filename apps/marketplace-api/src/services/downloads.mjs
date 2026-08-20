import { resolveEntitlement } from '../../../../marketplace/customer/entitlements.mjs';
function forbidden(code){const e=new Error(code);e.code=code;e.status=403;return e;}
function unavailable(code){const e=new Error(code);e.code=code;e.status=409;return e;}
export function createDownloadService({customerRepository,catalogRepository,artifactStore,now=()=>new Date()}={}){
  if(!customerRepository||!catalogRepository||!artifactStore)throw new TypeError('download service dependencies are required');
  return {async authorizeDownload(context,productVersionId,runtime='UNIVERSAL'){
    const subject=context?.subject;if(!subject?.id)throw forbidden('AUTH_SUBJECT_REQUIRED');
    const version=await catalogRepository.getProductVersion(productVersionId);if(!version)throw unavailable('PRODUCT_VERSION_UNAVAILABLE');
    const product=await catalogRepository.getProduct(version.product_id);if(!product)throw unavailable('PRODUCT_UNAVAILABLE');
    const distribution=await catalogRepository.getRuntimeDistribution(productVersionId,String(runtime).toUpperCase());
    if(!distribution||String(distribution.compatibility_state).toUpperCase()!=='VERIFIED')throw unavailable('RUNTIME_DISTRIBUTION_UNAVAILABLE');
    const entitlements=await customerRepository.listEntitlements(subject);
    const decision=resolveEntitlement({entitlements,product,version,runtime,now:now(),subject});
    if(!decision.allowed)throw forbidden('ENTITLEMENT_REQUIRED');
    const artifactId=distribution.artifact_id ?? distribution.id;
    const artifact=await artifactStore.getMetadata(artifactId);if(!artifact)throw unavailable('ARTIFACT_UNAVAILABLE');
    if(distribution.artifact_hash&&artifact.sha256!==distribution.artifact_hash)throw unavailable('ARTIFACT_METADATA_HASH_MISMATCH');
    const grant=await artifactStore.createReadGrant(artifactId,{subject,expiresInSeconds:60});
    return {entitlement_id:decision.entitlement_id,product,version,distribution,artifact,grant};
  }};
}
