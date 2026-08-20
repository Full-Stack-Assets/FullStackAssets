import test from 'node:test';
import assert from 'node:assert/strict';
import { listRuntimeAdapters, runtimeAdapter, assertAdapterDoesNotEscalate } from '../../../marketplace/distribution/adapters.mjs';

test('all canonical runtimes have thin non-authoritative adapters',()=>{
  const adapters=listRuntimeAdapters();
  assert.deepEqual(adapters.map((a)=>a.runtime),['UNIVERSAL','CHATGPT','CURSOR','GEMINI','GROK','MANUS','MCP']);
  for(const adapter of adapters){assert.equal(adapter.can_elevate_authority,false);assert.equal(adapter.can_mutate_canon,false);assert.equal(adapter.requires_evidence_receipt,true);}
});

test('unknown runtime has no fabricated adapter',()=>assert.equal(runtimeAdapter('magic-runtime'),null));

test('runtime permissions cannot exceed canonical permissions',()=>{
  const adapter=runtimeAdapter('CHATGPT');
  assert.equal(assertAdapterDoesNotEscalate({adapter,canonicalPermissions:['READ_REPO'],runtimePermissions:['READ_REPO']}),true);
  assert.throws(()=>assertAdapterDoesNotEscalate({adapter,canonicalPermissions:['READ_REPO'],runtimePermissions:['READ_REPO','DEPLOY_PROD']}),/RUNTIME_AUTHORITY_ESCALATION/);
});
