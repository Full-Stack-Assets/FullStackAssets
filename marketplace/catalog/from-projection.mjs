function list(value){
  if(Array.isArray(value)) return value.map((v)=>String(v).trim()).filter(Boolean);
  if(typeof value !== 'string') return [];
  return value.split(';').map((v)=>v.trim().replace(/[.]$/,'')).filter(Boolean);
}
function publicType(entityType){
  const type=String(entityType).toUpperCase();
  if(type==='SKILL') return 'SKILL';
  if(type==='ROLE' || type==='AGENT_DEFINITION' || type==='OVERLAY') return 'AGENT';
  if(type==='WORKFLOW' || type==='FACTORY') return 'WORKFLOW_PACK';
  return 'COLLECTION';
}
function descriptionFor(entity){ return entity.description ?? entity.purpose ?? entity.capability_text ?? ''; }

export function catalogEntryFromProjection({canonicalEntity,product,versions=[],publisher=null,compatibility=[],evaluation_summary=null,offer_summary=null}){
  if(!canonicalEntity?.id || !product?.id) throw new TypeError('canonicalEntity and projected product are required');
  if(!(product.canonical_refs ?? []).includes(canonicalEntity.id)) throw new Error('Projected product does not reference canonical entity');
  const skillIds=list(canonicalEntity.skill_ids ?? canonicalEntity.suggested_skill_ids);
  const integrationIds=list(canonicalEntity.integration_ids ?? canonicalEntity.suggested_integration_ids);
  return Object.freeze({
    id:canonicalEntity.id,
    type:publicType(canonicalEntity.entity_type),
    slug:product.slug,
    name:canonicalEntity.name,
    description:descriptionFor(canonicalEntity),
    domain:canonicalEntity.domain ?? (canonicalEntity.entity_type==='SKILL' ? 'Reusable Skills' : null),
    operating_class:canonicalEntity.operating_class ?? null,
    risk_label:canonicalEntity.risk_tier ?? canonicalEntity.provisional_risk ?? null,
    use_cases:list(canonicalEntity.use_cases),
    capabilities:list(canonicalEntity.capabilities ?? canonicalEntity.capability_text),
    skill_ids:skillIds,
    integration_ids:integrationIds,
    boundary:canonicalEntity.boundary || null,
    publisher:publisher,
    publisher_id:publisher?.id ?? product.publisher_id ?? null,
    commercial_state:product.commercial_state,
    offer_summary,
    version_summary:versions.map((v)=>v.version),
    versions:versions.map((v)=>v.version),
    compatibility,
    evaluation_summary,
    public:true,
  });
}
