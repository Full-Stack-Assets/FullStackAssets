const RISK=Object.freeze({LOW:0,MODERATE:1,HIGH:2,RESTRICTED:3});
function upperList(values){return [...new Set((values??[]).map((x)=>String(x).toUpperCase()))].sort();}

export function applyEnterprisePolicy({canonical={},overlay={}}={}){
  const canonicalRuntimes=upperList(canonical.allowed_runtimes??canonical.runtimes??[]);
  const requestedRuntimes=upperList(overlay.allowed_runtimes??[]);
  const allowed_runtimes=requestedRuntimes.length?canonicalRuntimes.filter((r)=>requestedRuntimes.includes(r)):canonicalRuntimes;
  const canonicalPermissions=upperList(canonical.permissions??[]);
  const denied=new Set(upperList(overlay.denied_permissions??[]));
  const permissions=canonicalPermissions.filter((p)=>!denied.has(p));
  const canonicalPublishers=[...new Set((canonical.allowed_publishers??[]).map(String))].sort();
  const requestedPublishers=[...new Set((overlay.allowed_publishers??[]).map(String))].sort();
  const allowed_publishers=requestedPublishers.length
    ? (canonicalPublishers.length?canonicalPublishers.filter((p)=>requestedPublishers.includes(p)):requestedPublishers)
    : canonicalPublishers;
  const canonicalRisk=String(canonical.max_risk_tier??'RESTRICTED').toUpperCase();
  const overlayRisk=String(overlay.max_risk_tier??canonicalRisk).toUpperCase();
  if(!(canonicalRisk in RISK)||!(overlayRisk in RISK)) throw new TypeError('ENTERPRISE_RISK_TIER_INVALID');
  const max_risk_tier=RISK[overlayRisk]<=RISK[canonicalRisk]?overlayRisk:canonicalRisk;
  return Object.freeze({allowed_runtimes:Object.freeze(allowed_runtimes),permissions:Object.freeze(permissions),allowed_publishers:Object.freeze(allowed_publishers),max_risk_tier,require_verified_runtime:overlay.require_verified_runtime!==false});
}

export function assertPolicyDoesNotExpand({canonical={},effective={}}={}){
  const canonicalPermissions=new Set(upperList(canonical.permissions??[]));
  const canonicalRuntimes=new Set(upperList(canonical.allowed_runtimes??canonical.runtimes??[]));
  const extraPermissions=(effective.permissions??[]).filter((x)=>!canonicalPermissions.has(String(x).toUpperCase()));
  const extraRuntimes=(effective.allowed_runtimes??[]).filter((x)=>!canonicalRuntimes.has(String(x).toUpperCase()));
  if(extraPermissions.length||extraRuntimes.length){const error=new Error('ENTERPRISE_POLICY_AUTHORITY_EXPANSION');error.code='ENTERPRISE_POLICY_AUTHORITY_EXPANSION';throw error;}
  return true;
}
