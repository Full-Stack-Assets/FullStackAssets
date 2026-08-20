import { createUniversalManifest } from './manifest.mjs';
import { runtimeAdapter, assertAdapterDoesNotEscalate } from './adapters.mjs';

function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)]));return value;}

export function buildRuntimePackagePlan(input={}){
  const runtime=String(input.runtime??'UNIVERSAL').toUpperCase();
  const adapter=runtimeAdapter(runtime);
  if(!adapter) return Object.freeze({runtime,state:'UNAVAILABLE',reason:'ADAPTER_UNAVAILABLE'});
  const universal=createUniversalManifest(input.manifest);
  assertAdapterDoesNotEscalate({adapter,canonicalPermissions:input.canonical_permissions??[],runtimePermissions:input.runtime_permissions??[]});
  const files=[...adapter.required_files].sort();
  const plan=stable({
    runtime,
    adapter_format:adapter.format,
    adapter_version:String(input.adapter_version??'1.0.0'),
    product_id:universal.product_id,
    product_version_id:universal.product_version_id,
    canonical_refs:universal.canonical_refs,
    canonical_hashes:universal.canonical_hashes,
    provenance_receipt_id:universal.provenance_receipt_id,
    files,
    permissions:[...(input.runtime_permissions??[])].map(String).sort(),
  });
  return Object.freeze({...plan,state:'PLANNED'});
}

export function packagePlanFingerprint(plan){
  return JSON.stringify(stable(plan));
}
