import { assertStableId } from "./constants.mjs";

function scalar(value) {
  if (value === undefined || value === null || value === "") return null;
  return value;
}

function bool(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;
  if (/^true$/i.test(String(value))) return true;
  if (/^false$/i.test(String(value))) return false;
  throw new TypeError(`Invalid boolean: ${String(value)}`);
}

function semicolonList(value) {
  if (value === undefined || value === null || String(value).trim() === "") return [];
  return [...new Set(String(value).split(";").map(v => v.trim()).filter(Boolean))].sort();
}

function status(value) {
  if (value === undefined || value === null || value === "") return null;
  return String(value).toUpperCase();
}

export function normalizeSkill(row) {
  return {
    entity_type: "SKILL",
    id: assertStableId(row.skill_id),
    name: scalar(row.name),
    slug: scalar(row.slug),
    purpose: scalar(row.purpose),
    common_roles: scalar(row.common_roles),
    minimum_test_fixture: scalar(row.minimum_test_fixture),
    status: status(row.status),
    path: scalar(row.path),
  };
}

export function normalizeRole(row) {
  return {
    entity_type: "ROLE",
    id: assertStableId(row.role_id),
    name: scalar(row.name),
    slug: scalar(row.slug),
    path: scalar(row.path),
    domain: scalar(row.domain),
    section: scalar(row.section),
    operating_class: scalar(row.operating_class),
    source_file: scalar(row.source_file),
    overlay: bool(row.overlay),
    attached_to: semicolonList(row.attached_to),
    use_cases: scalar(row.use_cases),
    capability_text: scalar(row.capability_text),
    skill_ids: semicolonList(row.suggested_skill_ids),
    integrations: scalar(row.integrations),
    integration_ids: semicolonList(row.suggested_integration_ids),
    output: scalar(row.output),
    gate: scalar(row.gate),
    handoff: scalar(row.handoff),
    boundary: scalar(row.boundary),
    description_path: scalar(row.description_path),
    skill_path: scalar(row.skill_path),
    manifest_path: scalar(row.manifest_path),
    visual_path: scalar(row.visual_path),
    status: status(row.status),
    provider_neutral: bool(row.provider_neutral),
    runtime_promoted: bool(row.runtime_promoted),
    provisional_risk: scalar(row.provisional_risk),
  };
}

export function normalizeIntegration(row) {
  return {
    entity_type: "INTEGRATION",
    id: assertStableId(row.integration_id),
    name: scalar(row.name),
    typical_uses: scalar(row.typical_uses),
    default_scope: scalar(row.default_scope),
    human_authority_actions: scalar(row.human_authority_actions),
    status: status(row.status),
    path: scalar(row.path),
  };
}

export function normalizeOverlay(row) {
  return {
    entity_type: "OVERLAY",
    id: assertStableId(row.role_id),
    name: scalar(row.name),
    slug: scalar(row.slug),
    path: scalar(row.path),
    domain: scalar(row.domain),
    section: scalar(row.section),
    operating_class: scalar(row.operating_class),
    source_file: scalar(row.source_file),
    overlay: bool(row.overlay),
    attached_to: semicolonList(row.attached_to),
    use_cases: scalar(row.use_cases),
    capability_text: scalar(row.capability_text),
    skill_ids: semicolonList(row.suggested_skill_ids),
    integrations: scalar(row.integrations),
    integration_ids: semicolonList(row.suggested_integration_ids),
    output: scalar(row.output),
    gate: scalar(row.gate),
    handoff: scalar(row.handoff),
    boundary: scalar(row.boundary),
    status: status(row.status),
    description_path: scalar(row.description_path),
    visual_path: scalar(row.visual_path),
  };
}

function normalizeRelationship(row) {
  return {
    from_type: String(row.from_type || "").toUpperCase(),
    from_id: assertStableId(row.from_id),
    relation: String(row.relation || "").toUpperCase(),
    to_type: String(row.to_type || "").toUpperCase(),
    to_id: assertStableId(row.to_id),
  };
}

function sortById(items) {
  return items.sort((a, b) => a.id.localeCompare(b.id));
}

function rejectDuplicates(group) {
  const seen = new Set();
  for (const entity of group) {
    if (seen.has(entity.id)) throw new Error(`CANON_DUPLICATE_ID:${entity.id}`);
    seen.add(entity.id);
  }
}

export function normalizeExport(raw) {
  const normalized = {
    roles: sortById((raw.roles || []).map(normalizeRole)),
    skills: sortById((raw.skills || []).map(normalizeSkill)),
    integrations: sortById((raw.integrations || []).map(normalizeIntegration)),
    overlays: sortById((raw.overlays || []).map(normalizeOverlay)),
    relationships: (raw.relationships || []).map(normalizeRelationship).sort((a, b) =>
      `${a.from_type}:${a.from_id}:${a.relation}:${a.to_type}:${a.to_id}`.localeCompare(`${b.from_type}:${b.from_id}:${b.relation}:${b.to_type}:${b.to_id}`)
    ),
  };
  for (const group of [normalized.roles, normalized.skills, normalized.integrations, normalized.overlays]) rejectDuplicates(group);
  return normalized;
}
