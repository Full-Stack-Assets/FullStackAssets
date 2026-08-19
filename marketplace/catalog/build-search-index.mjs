const DEFAULT_SYNONYMS = Object.freeze({
  pr:['pull','request','code','review'],
  competitor:['competitive','market','rival'],
  research:['source','intelligence','investigate'],
  bug:['defect','issue','error'],
  deploy:['release','delivery','production'],
});
const STOP = new Set(['a','an','the','my','our','to','for','of','and','or','in','on','with','please','need','want']);
function stem(token){ return token.length > 3 && token.endsWith('s') ? token.slice(0,-1) : token; }
function tokenize(value){ return String(value ?? '').toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g)?.map(stem).filter((t)=>!STOP.has(t)) ?? []; }
function flatten(values){ return (Array.isArray(values) ? values : [values]).flatMap(tokenize); }
function expandQuery(query, synonyms){
  const base = tokenize(query);
  const out = new Set(base);
  for (const token of base) for (const syn of (synonyms[token] ?? [])) for (const t of tokenize(syn)) out.add(t);
  return [...out];
}
function fieldScore(tokens, queryTokens, weight){
  const set = new Set(tokens);
  return queryTokens.reduce((score,t)=>score + (set.has(t) ? weight : 0), 0);
}
function normalizeRuntime(value){ return Array.isArray(value) ? value.map(v=>String(v).toUpperCase()) : []; }

export function buildSearchIndex(catalog, synonyms = DEFAULT_SYNONYMS) {
  const entries = (catalog.entries ?? []).map((entry)=>({
    id:entry.id, type:entry.type, name:entry.name, domain:entry.domain ?? null,
    commercial_state:entry.commercial_state ?? 'REFERENCE_ONLY', publisher:entry.publisher_id ?? entry.publisher?.id ?? null,
    runtimes:normalizeRuntime(entry.compatibility_summary ?? entry.compatibility ?? []),
    fields:{
      title:flatten(entry.name),
      use_cases:flatten(entry.use_cases ?? []),
      capabilities:flatten(entry.capabilities ?? []),
      domain:flatten(entry.domain),
      related:flatten([...(entry.skill_ids ?? []), ...(entry.related_ids ?? [])]),
      description:flatten(entry.description),
      tags:flatten(entry.tags ?? []),
    },
  })).sort((a,b)=>a.id.localeCompare(b.id));
  return Object.freeze({generated_at:catalog.generated_at ?? null,synonyms:structuredClone(synonyms),entries});
}

export function searchIndex(index, query, filters = {}) {
  const q = String(query ?? '').trim();
  const queryTokens = expandQuery(q, index.synonyms ?? DEFAULT_SYNONYMS);
  const exactId = q.toUpperCase();
  return index.entries
    .filter((entry)=> !filters.type || entry.type === String(filters.type).toUpperCase())
    .filter((entry)=> !filters.domain || entry.domain === filters.domain)
    .filter((entry)=> !filters.runtime || entry.runtimes.includes(String(filters.runtime).toUpperCase()))
    .filter((entry)=> !filters.commercial_state || entry.commercial_state === String(filters.commercial_state).toUpperCase())
    .filter((entry)=> !filters.publisher || entry.publisher === filters.publisher)
    .map((entry)=>{
      let score = entry.id.toUpperCase() === exactId && exactId ? 100 : 0;
      score += fieldScore(entry.fields.title, queryTokens, 30);
      score += fieldScore(entry.fields.use_cases, queryTokens, 20);
      score += fieldScore(entry.fields.capabilities, queryTokens, 18);
      score += fieldScore(entry.fields.domain, queryTokens, 12);
      score += fieldScore(entry.fields.related, queryTokens, 10);
      score += fieldScore(entry.fields.description, queryTokens, 8);
      score += fieldScore(entry.fields.tags, queryTokens, 6);
      return {...entry,score};
    })
    .filter((entry)=>queryTokens.length === 0 || entry.score > 0)
    .sort((a,b)=>b.score-a.score || a.id.localeCompare(b.id));
}
