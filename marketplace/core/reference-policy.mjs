export const PUBLIC_REFERENCE_FIELDS = Object.freeze([
  'id','entity_type','name','description','use_cases','domain','operating_class','risk_tier',
  'boundary','skill_ids','integration_ids','evaluation_summary','compatibility_state','version','status',
]);

export function referenceVisibilityDecision(entity = {}) {
  if (String(entity.public_metadata_classification ?? '').toUpperCase() === 'RESTRICTED') {
    return { public:false, fields:[], reasons:['PUBLIC_METADATA_RESTRICTED'] };
  }
  if (entity.provenance_complete !== true) {
    return { public:false, fields:[], reasons:['PROVENANCE_INCOMPLETE'] };
  }
  const fields = PUBLIC_REFERENCE_FIELDS.filter((field) => entity[field] !== undefined);
  return { public:true, fields, reasons:[] };
}

export function projectPublicReference(entity = {}) {
  const decision = referenceVisibilityDecision(entity);
  if (!decision.public) return null;
  return Object.freeze(Object.fromEntries(decision.fields.map((field) => [field, structuredClone(entity[field])])));
}
