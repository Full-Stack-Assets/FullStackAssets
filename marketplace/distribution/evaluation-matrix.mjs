import { compatibilityMatrix } from './compatibility.mjs';
import { runtimeAdapter } from './adapters.mjs';

export function buildEvaluationMatrix({distributions=[],evaluations=[],requiredRuntimes=[]}={}){
  const evalByRuntime=new Map(evaluations.map((e)=>[String(e.runtime).toUpperCase(),e]));
  const rows=distributions.map((distribution)=>{
    const runtime=String(distribution.runtime).toUpperCase();
    return {runtime,adapter:runtimeAdapter(runtime),distribution,evaluation:evalByRuntime.get(runtime)??null};
  });
  return compatibilityMatrix({runtimes:rows,requiredRuntimes});
}

export function publicCompatibilitySummary(matrix){
  return matrix.rows.map(({runtime,state,reason,evaluation_receipt_id,artifact_hash})=>({runtime,state,reason,evaluation_receipt_id:evaluation_receipt_id??null,artifact_hash:artifact_hash??null}));
}
