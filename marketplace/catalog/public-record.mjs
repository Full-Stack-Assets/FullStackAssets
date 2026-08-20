const ALLOWED = Object.freeze([
  'id','type','slug','name','description','domain','operating_class','risk_label','risk_tier','use_cases','capabilities',
  'skill_ids','integration_ids','boundary','compatibility_summary','evaluation_summary','publisher','publisher_id',
  'commercial_state','offer_summary','version_summary','related_ids','components','versions','compatibility','tags',
]);
function clone(value){ return value === undefined ? undefined : structuredClone(value); }
export function publicCatalogRecord(source = {}) {
  if (source.public === false) return null;
  const record = {};
  for (const key of ALLOWED) if (source[key] !== undefined) record[key] = clone(source[key]);
  if (!record.id || !record.type || !record.slug || !record.name) throw new TypeError('Public catalog record requires id, type, slug, and name');
  record.commercial_state = String(record.commercial_state ?? 'REFERENCE_ONLY').toUpperCase();
  record.commerce = record.commercial_state === 'REFERENCE_ONLY' ? null : (record.offer_summary ? {
    state:record.commercial_state,
    currency:record.offer_summary.currency ?? null,
    amount:record.offer_summary.amount ?? null,
    offer_class:record.offer_summary.offer_class ?? null,
  } : { state:record.commercial_state, currency:null, amount:null, offer_class:null });
  delete record.offer_summary;
  return Object.freeze(record);
}
