function forbidden(){const e=new Error('FORBIDDEN');e.code='FORBIDDEN';e.status=403;throw e;}
function activeMembership(context,organizationId){return (context?.memberships??[]).find((m)=>m.organization_id===organizationId&&m.status==='ACTIVE');}
export function assertRegistryAccess(context,registry,{admin=false}={}){
  if(!registry?.organization_id) throw new TypeError('REGISTRY_ORGANIZATION_REQUIRED');
  const membership=activeMembership(context,registry.organization_id);
  if(!membership) forbidden();
  if(admin && membership.app_role!=='ORG_ADMIN') forbidden();
  return membership;
}

export function projectPrivateRegistry({context,registry,entries=[],productsById=new Map()}={}){
  const membership=assertRegistryAccess(context,registry);
  return entries.filter((entry)=>entry.registry_id===registry.id).filter((entry)=>entry.visibility!=='ORG_ADMIN_ONLY'||membership.app_role==='ORG_ADMIN').map((entry)=>{
    const product=productsById.get(entry.product_id)??null;
    return Object.freeze({id:entry.id,registry_id:registry.id,product_id:entry.product_id,product_version_id:entry.product_version_id??null,version_policy:entry.version_policy,visibility:entry.visibility,product});
  });
}

export function assertNoCanonicalFork(entry){
  const forbiddenFields=['canonical_content','canonical_patch','role_definition','skill_definition'];
  const found=forbiddenFields.filter((key)=>entry?.[key]!==undefined);
  if(found.length){const error=new Error('PRIVATE_REGISTRY_CANON_FORK_FORBIDDEN');error.code='PRIVATE_REGISTRY_CANON_FORK_FORBIDDEN';error.fields=found;throw error;}
  if(!entry?.product_id) throw new TypeError('PRIVATE_REGISTRY_PRODUCT_REQUIRED');
  return true;
}
