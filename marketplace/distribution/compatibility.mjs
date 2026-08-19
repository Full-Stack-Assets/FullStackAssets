export const COMPATIBILITY_STATES=Object.freeze(['VERIFIED','EXPERIMENTAL','UNAVAILABLE','BLOCKED','DEPRECATED']);

function fail(state,reason,extra={}){return Object.freeze({state,reason,...extra});}
export function evaluateRuntimeCompatibility({adapter,distribution,evaluation,required=false,now=new Date()}={}){
  if(!adapter) return fail('UNAVAILABLE','ADAPTER_UNAVAILABLE',{required});
  if(distribution?.availability==='DEPRECATED') return fail('DEPRECATED','DISTRIBUTION_DEPRECATED',{required});
  if(distribution?.security_status==='BLOCKED') return fail('BLOCKED','SECURITY_BLOCKED',{required});
  if(distribution?.dependency_status==='BLOCKED') return fail('BLOCKED','DEPENDENCY_BLOCKED',{required});
  if(!distribution?.artifact_hash) return fail('EXPERIMENTAL','PACKAGE_NOT_VERIFIED',{required});
  if(!evaluation) return fail('EXPERIMENTAL','EVALUATION_MISSING',{required});
  if(evaluation.provenance_complete!==true) return fail('BLOCKED','PROVENANCE_INCOMPLETE',{required});
  if(Number(evaluation.critical_failures??0)>0 || evaluation.status==='FAIL') return fail('BLOCKED','EVALUATION_FAILED',{required});
  if(evaluation.status!=='PASS') return fail('EXPERIMENTAL','EVALUATION_INCOMPLETE',{required});
  const evaluatedAt=new Date(evaluation.evaluated_at??now);
  if(Number.isNaN(evaluatedAt.getTime())) return fail('BLOCKED','EVALUATION_TIMESTAMP_INVALID',{required});
  return fail('VERIFIED','EVIDENCE_COMPLETE',{required,evaluation_receipt_id:evaluation.receipt_id??null,artifact_hash:distribution.artifact_hash});
}

export function compatibilityMatrix({runtimes=[],requiredRuntimes=[]}={}){
  const required=new Set(requiredRuntimes.map((x)=>String(x).toUpperCase()));
  const rows=runtimes.map((entry)=>{
    const runtime=String(entry.runtime).toUpperCase();
    return Object.freeze({runtime,...evaluateRuntimeCompatibility({...entry,required:required.has(runtime)})});
  }).sort((a,b)=>a.runtime.localeCompare(b.runtime));
  const blocking_required=rows.filter((row)=>row.required && row.state!=='VERIFIED').map((row)=>row.runtime);
  return Object.freeze({rows:Object.freeze(rows),status:blocking_required.length?'BLOCKED':'PASS',blocking_required:Object.freeze(blocking_required)});
}
