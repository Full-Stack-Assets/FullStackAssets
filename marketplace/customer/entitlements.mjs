function semver(value) {
  const match=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(String(value ?? ''));
  if(!match) throw new TypeError(`SEMVER_INVALID:${String(value ?? '')}`);
  return match.slice(1).map(Number);
}
function cmp(a,b){for(let i=0;i<3;i++){const d=a[i]-b[i];if(d)return d;}return 0;}
function versionAllowed(policy, acquiredValue, targetValue){
  const acquired=semver(acquiredValue), target=semver(targetValue);
  if(cmp(target,acquired)<0) return false;
  switch(String(policy)){
    case 'EXACT': return cmp(target,acquired)===0;
    case 'PATCH_PINNED': return cmp(target,acquired)===0;
    case 'MINOR_PINNED': return target[0]===acquired[0] && target[1]===acquired[1];
    case 'MAJOR_PINNED': return target[0]===acquired[0];
    case 'CURRENT_WHILE_ACTIVE': return true;
    default: throw new TypeError(`ENTITLEMENT_VERSION_POLICY_INVALID:${String(policy)}`);
  }
}
function subjectMatches(entitlement,subject){
  if(!subject) return true;
  if(subject.type==='USER') return entitlement.user_id===subject.id && !entitlement.organization_id;
  if(subject.type==='ORGANIZATION') return entitlement.organization_id===subject.id && !entitlement.user_id;
  return false;
}
function timeActive(entitlement,now){
  const time=now instanceof Date?now:new Date(now);
  if(Number.isNaN(time.getTime())) throw new TypeError('ENTITLEMENT_TIME_INVALID');
  if(entitlement.starts_at && new Date(entitlement.starts_at)>time) return false;
  if(entitlement.expires_at && new Date(entitlement.expires_at)<=time) return false;
  return true;
}
function runtimeAllowed(entitlement,runtime){
  const allowed=Array.isArray(entitlement.allowed_runtimes)?entitlement.allowed_runtimes:['UNIVERSAL'];
  return allowed.map((value)=>String(value).toUpperCase()).includes(String(runtime ?? 'UNIVERSAL').toUpperCase());
}
export function resolveEntitlement({entitlements=[],product,version,runtime='UNIVERSAL',now=new Date(),subject=null}={}){
  if(!product?.id) throw new TypeError('ENTITLEMENT_PRODUCT_REQUIRED');
  if(!version?.version) throw new TypeError('ENTITLEMENT_VERSION_REQUIRED');
  semver(version.version);
  const productEntitlements=entitlements.filter((item)=>item?.product_id===product.id);
  for(const entitlement of productEntitlements){
    if(String(entitlement.status).toUpperCase()!=='ACTIVE') continue;
    if(!subjectMatches(entitlement,subject)) continue;
    if(!timeActive(entitlement,now)) continue;
    if(!runtimeAllowed(entitlement,runtime)) continue;
    if(!versionAllowed(entitlement.version_policy,entitlement.acquired_version,version.version)) continue;
    return {allowed:true,entitlement_id:entitlement.id,reason:'ENTITLED',max_version_policy:entitlement.version_policy};
  }
  return {allowed:false,entitlement_id:null,reason:'NO_MATCHING_ACTIVE_ENTITLEMENT',max_version_policy:null};
}
