import { REQUIRED_GATES, verifyRelease } from '../release/gates.mjs';

export const REQUIRED_UNITS=Object.freeze([1,2,3,4,5,6,7,8]);
export const ENTERPRISE_GATES=Object.freeze(['RUNTIME_DISTRIBUTION','ENTERPRISE_ISOLATION','PUBLISHER_GOVERNANCE']);

export function buildLaunchEvidence({unitReceipts={},releaseGates={},enterpriseGates={},criticalFindings=[]}={}){
  const missingUnits=REQUIRED_UNITS.filter((unit)=>unitReceipts[unit]?.status!=='PASS');
  let release;
  try{release=verifyRelease(releaseGates);}catch(error){release={status:'BLOCK',failed:REQUIRED_GATES.filter((g)=>releaseGates[g]!=='PASS'),error:error.message};}
  const enterpriseFailed=ENTERPRISE_GATES.filter((g)=>enterpriseGates[g]!=='PASS');
  const critical=criticalFindings.filter((f)=>String(f.severity).toUpperCase()==='CRITICAL'&&f.resolved!==true);
  const status=!missingUnits.length&&release.status==='PASS'&&!enterpriseFailed.length&&!critical.length?'PASS':'BLOCK';
  return Object.freeze({status,unit_receipts:Object.freeze({...unitReceipts}),missing_units:Object.freeze(missingUnits),release,Object.freeze,enterprise_failed:Object.freeze(enterpriseFailed),critical_findings:Object.freeze(critical),evidence_complete:status==='PASS'});
}

export function assertLaunchEvidenceComplete(bundle){
  if(bundle?.status!=='PASS'||bundle?.evidence_complete!==true){const error=new Error('MARKETPLACE_LAUNCH_EVIDENCE_INCOMPLETE');error.code='MARKETPLACE_LAUNCH_EVIDENCE_INCOMPLETE';throw error;}
  return true;
}
