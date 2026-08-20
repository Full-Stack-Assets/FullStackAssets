import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRuntimeCompatibility, compatibilityMatrix } from '../../../marketplace/distribution/compatibility.mjs';
import { runtimeAdapter } from '../../../marketplace/distribution/adapters.mjs';

const pass={status:'PASS',provenance_complete:true,critical_failures:0,receipt_id:'EV-1',evaluated_at:'2026-08-19T12:00:00Z'};
const dist={artifact_hash:'abc',security_status:'PASS',dependency_status:'PASS'};

test('verified requires adapter package and passing evidence',()=>assert.equal(evaluateRuntimeCompatibility({adapter:runtimeAdapter('CHATGPT'),distribution:dist,evaluation:pass}).state,'VERIFIED'));
test('missing evaluation remains experimental',()=>assert.equal(evaluateRuntimeCompatibility({adapter:runtimeAdapter('CHATGPT'),distribution:dist,evaluation:null}).state,'EXPERIMENTAL'));
test('security failure blocks runtime without falsifying other runtimes',()=>{
  const matrix=compatibilityMatrix({runtimes:[
    {runtime:'CHATGPT',adapter:runtimeAdapter('CHATGPT'),distribution:dist,evaluation:pass},
    {runtime:'GEMINI',adapter:runtimeAdapter('GEMINI'),distribution:{...dist,security_status:'BLOCKED'},evaluation:pass},
  ]});
  assert.equal(matrix.rows.find((r)=>r.runtime==='CHATGPT').state,'VERIFIED');
  assert.equal(matrix.rows.find((r)=>r.runtime==='GEMINI').state,'BLOCKED');
  assert.equal(matrix.status,'PASS');
});
test('required runtime failure blocks matrix',()=>{
  const matrix=compatibilityMatrix({requiredRuntimes:['GEMINI'],runtimes:[{runtime:'GEMINI',adapter:runtimeAdapter('GEMINI'),distribution:{...dist,security_status:'BLOCKED'},evaluation:pass}]});
  assert.equal(matrix.status,'BLOCKED');
  assert.deepEqual(matrix.blocking_required,['GEMINI']);
});
