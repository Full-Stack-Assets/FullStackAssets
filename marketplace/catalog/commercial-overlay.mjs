import {FIRST_COHORT} from '../launch/first-cohort.mjs';

const ALLOWED=new Set(['commercial_state','offer_summary','commerce','version_summary','versions','compatibility','evaluation_summary']);
function clone(value){return structuredClone(value);}
function overlayEntry(product){
  const offer={offer_id:`OFF-FIRST10-${product.canonical_ref}`,offer_class:'FREE',currency:'USD',amount:0};
  const compatibility=product.runtimes.map(runtime=>({runtime,state:product.runtime_states[runtime],package_available:true,version:product.version}));
  return Object.freeze({
    commercial_state:'FREE',
    offer_summary:offer,
    commerce:{state:'FREE',currency:'USD',amount:0,offer_class:'FREE',offer_id:offer.offer_id},
    version_summary:{current:product.version,versions:[product.version]},
    versions:[product.version],
    compatibility,
    evaluation_summary:{status:'PACKAGE_VERIFIED',semantic_score:null},
  });
}
export function firstCohortCommercialOverlay(){return Object.freeze({entries:Object.freeze(Object.fromEntries(FIRST_COHORT.map(product=>[product.product_id,overlayEntry(product)])))});}
export function applyCommercialOverlay(catalog={},overlay={entries:{}}){
  const source=clone(catalog);const entries=Array.isArray(source.entries)?source.entries:[];const byId=new Map(entries.map(entry=>[entry.id,entry]));
  for(const [id,patch] of Object.entries(overlay.entries??{})){
    const target=byId.get(id);if(!target)throw new Error(`OVERLAY_UNKNOWN_PRODUCT:${id}`);
    for(const key of Object.keys(patch)){if(!ALLOWED.has(key))throw new Error(`OVERLAY_FIELD_NOT_ALLOWED:${key}`);target[key]=clone(patch[key]);}
  }
  const states=[...new Set(entries.map(entry=>String(entry.commercial_state??'REFERENCE_ONLY').toUpperCase()))].sort();
  source.taxonomy={...(source.taxonomy??{}),commercial_states:states};
  return source;
}
