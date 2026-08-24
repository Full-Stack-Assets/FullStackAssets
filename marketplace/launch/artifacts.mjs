import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {FIRST_COHORT,buildCohortPackagePlans} from './first-cohort.mjs';
import {runtimeAdapter} from '../distribution/adapters.mjs';
import {createStoreZip} from '../distribution/store-zip.mjs';

const LICENSE_TEXT=`Full Stack Assets Marketplace License Reference\n\nLicense class: FREE_COMMERCIAL\nPolicy ID: LIC-FIRST10-FREE-COMMERCIAL\nPrice: $0\n\nThis package does not grant system credentials, external-action authority, Human Authority, or permission beyond the canonical role/skill boundaries. The marketplace license policy is the governing machine-readable record.\n`;
function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function json(value){return JSON.stringify(value,null,2)+'\n';}
function safeName(value){return String(value).toLowerCase().replace(/[^a-z0-9.-]+/g,'-');}
function instructionText(product,runtime){return `# ${product.name}\n\nCanonical reference: ${product.canonical_ref}\nRuntime: ${runtime}\nVersion: ${product.version}\nDefault integration tier: I0 (supplied inputs only).\n\n## Purpose\n${product.purpose}\n\n## Boundaries\n${product.boundaries.map(x=>`- ${x}`).join('\n')}\n\n## Required behavior\n- Work only from the supplied inputs unless a separately approved integration is attached by the host environment.\n- Preserve provenance and distinguish verified facts from assumptions.\n- Do not infer credentials, external-action permission, or Human Authority from installation.\n- Stop or escalate when the declared boundary or fixture-specific failure condition is reached.\n\n## Evaluation fixture\n${product.fixture}\n`;
}
function manifestFor(product,runtime,state){return {schema_version:'1.0',product_id:product.product_id,product_version_id:product.product_version_id,version:product.version,canonical_refs:[product.canonical_ref],canonical_hashes:[product.canonical_hash],license_ref:'LIC-FIRST10-FREE-COMMERCIAL',provenance_receipt_id:product.provenance_receipt_id,runtime,compatibility_state:state,default_integration_tier:'I0',permissions:[],authority:{can_mutate_canon:false,can_elevate_authority:false,human_authority_granted:false},components:[{type:product.type,canonical_ref:product.canonical_ref}]};}
function packageEntries(product,runtime){
  const state=product.runtime_states[runtime];const manifest=manifestFor(product,runtime,state);const instruction=instructionText(product,runtime);const entries=new Map([['manifest.json',json(manifest)]]);
  if(runtime==='UNIVERSAL'){
    entries.set('README.md',instruction);entries.set('LICENSE',LICENSE_TEXT);entries.set('CHANGELOG.md',`# Changelog\n\n## ${product.version}\n- Initial first-party marketplace release.\n`);
    entries.set('canonical/spec.json',json(product.canonical_snapshot));
    entries.set('evaluations/fixture.json',json({canonical_ref:product.canonical_ref,fixture:product.fixture,scope:'STRUCTURAL_AND_BOUNDARY_FIXTURE',semantic_score:null}));
    entries.set('provenance/receipt.json',json({id:product.provenance_receipt_id,canonical_ref:product.canonical_ref,canonical_hash:product.canonical_hash,source:'Agentic AI Role Library Canon',version:product.version}));
  } else if(runtime==='CHATGPT') entries.set('SKILL.md',instruction);
  else if(runtime==='CURSOR') entries.set(`rules/${safeName(product.canonical_ref)}.mdc`,instruction);
  else if(['GEMINI','GROK','MANUS'].includes(runtime)) entries.set('instructions.md',instruction);
  else if(runtime==='MCP') entries.set('mcp.json',json({schema_version:'1.0',mode:'instruction-package',integration_tier:'I0',tools:[],note:'No MCP tools are bundled; supplied-input capability only.'}));
  else throw new Error(`UNSUPPORTED_RUNTIME:${runtime}`);
  return entries;
}

export function buildArtifactBytes(product,runtime){
  if(!product)throw new TypeError('PRODUCT_REQUIRED');
  if(!runtimeAdapter(runtime))throw new Error(`UNSUPPORTED_RUNTIME:${runtime}`);
  return createStoreZip(packageEntries(product,String(runtime).toUpperCase()));
}

export function buildFirstCohortArtifacts({outDir}){
  if(!outDir)throw new TypeError('OUT_DIR_REQUIRED');mkdirSync(outDir,{recursive:true});
  const plans=buildCohortPackagePlans();const products=new Map(FIRST_COHORT.map(x=>[x.product_id,x]));const artifacts=[];
  for(const plan of plans){
    const product=products.get(plan.product_id);if(!product)throw new Error(`COHORT_PRODUCT_MISSING:${plan.product_id}`);
    const bytes=buildArtifactBytes(product,plan.runtime);const digest=sha256(bytes);const filename=`${safeName(product.canonical_ref)}-${plan.runtime.toLowerCase()}-${product.version}.zip`;const path=join(outDir,filename);writeFileSync(path,bytes);
    artifacts.push(Object.freeze({product_id:product.product_id,product_version_id:product.product_version_id,canonical_ref:product.canonical_ref,runtime:plan.runtime,compatibility_state:product.runtime_states[plan.runtime],required_files:runtimeAdapter(plan.runtime).required_files,path,filename,sha256:digest,size_bytes:bytes.length}));
  }
  return Object.freeze(artifacts);
}
