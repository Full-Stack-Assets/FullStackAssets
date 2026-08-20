const MAJOR_FIELDS = new Set([
  'integration_ids','integrations','risk_tier','permission_tier','permission_tiers','data_classifications',
  'prohibited_actions','allowed_actions','decision_authority','authority','external_action','external_actions',
  'safety_boundaries','safety_boundary','schema','input_schema','output_schema','human_approval_boundary',
]);
const MINOR_FIELDS = new Set(['outputs','runtime_compatibility','compatibility','optional_inputs','optional_outputs']);

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
function equal(a,b) { return stable(a) === stable(b); }
function isStrictAdditive(previous, next) {
  if (!Array.isArray(previous) || !Array.isArray(next)) return false;
  const before = new Set(previous.map(stable));
  const after = new Set(next.map(stable));
  if (after.size < before.size) return false;
  for (const item of before) if (!after.has(item)) return false;
  return after.size > before.size;
}

export function classifyCanonicalChange(previousEntity = {}, nextEntity = {}) {
  const keys = new Set([...Object.keys(previousEntity), ...Object.keys(nextEntity)]);
  let severity = 'PATCH';
  for (const key of keys) {
    const before = previousEntity[key];
    const after = nextEntity[key];
    if (equal(before, after)) continue;
    if (MAJOR_FIELDS.has(key)) return 'MAJOR';
    if (MINOR_FIELDS.has(key)) {
      if (isStrictAdditive(before ?? [], after ?? [])) severity = severity === 'PATCH' ? 'MINOR' : severity;
      else return 'MAJOR';
    }
  }
  return severity;
}
