import { publicCatalogRecord } from './public-record.mjs';

function uniqSorted(values){ return [...new Set(values.filter((v)=>v !== null && v !== undefined && v !== ''))].sort((a,b)=>String(a).localeCompare(String(b))); }

export function buildPublicCatalog(readModel = {}) {
  const entries = (readModel.entries ?? []).map(publicCatalogRecord).filter(Boolean).sort((a,b)=>a.id.localeCompare(b.id));
  const publishers = [...(readModel.publishers ?? [])]
    .filter((p)=>p.public !== false)
    .map((p)=>({id:p.id,name:p.name,trust_tier:p.trust_tier ?? null}))
    .sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  return Object.freeze({
    generated_at: readModel.generated_at ?? null,
    entries,
    publishers,
    taxonomy: Object.freeze({
      domains: uniqSorted(entries.map((e)=>e.domain)),
      types: uniqSorted(entries.map((e)=>e.type)),
      commercial_states: uniqSorted(entries.map((e)=>e.commercial_state)),
    }),
  });
}
