import { normalizeExport } from "./normalize.mjs";
import { relationshipEdges, validateRelationships } from "./relationships.mjs";
import { canonicalEntityKey } from "./constants.mjs";
import { sha256, stableStringify } from "./hash.mjs";

function hashEntity(entity) {
  const withoutHash = { ...entity };
  delete withoutHash.content_hash;
  return { ...withoutHash, content_hash: sha256(withoutHash) };
}

export function buildSnapshot(exportData) {
  const normalized = normalizeExport(exportData);
  validateRelationships(normalized);
  return {
    schema_version: 1,
    roles: normalized.roles.map(hashEntity),
    skills: normalized.skills.map(hashEntity),
    integrations: normalized.integrations.map(hashEntity),
    overlays: normalized.overlays.map(hashEntity),
    relationships: relationshipEdges(normalized),
  };
}

export function buildChecksums(snapshot) {
  const entities = {};
  for (const group of [snapshot.roles || [], snapshot.skills || [], snapshot.integrations || [], snapshot.overlays || []]) {
    for (const entity of group) entities[canonicalEntityKey(entity)] = entity.content_hash;
  }
  return {
    schema_version: 1,
    snapshot: sha256(stableStringify(snapshot)),
    entities: Object.fromEntries(Object.entries(entities).sort(([a], [b]) => a.localeCompare(b))),
  };
}
