import { canonicalEntityKey } from "./constants.mjs";

function groups(snapshot) {
  if (Array.isArray(snapshot)) return [snapshot];
  return [snapshot.roles || [], snapshot.skills || [], snapshot.integrations || [], snapshot.overlays || []];
}

export function buildRegistryIndex(snapshotOrEntities) {
  const index = new Map();
  for (const group of groups(snapshotOrEntities)) {
    for (const entity of group) {
      const key = canonicalEntityKey(entity);
      if (index.has(key)) throw new Error(`CANON_DUPLICATE_KEY:${key}`);
      index.set(key, entity);
    }
  }
  return index;
}

function derivedEdges(snapshot) {
  const edges = [];
  for (const entity of [...(snapshot.roles || []), ...(snapshot.overlays || [])]) {
    const from = canonicalEntityKey(entity);
    for (const skillId of entity.skill_ids || []) edges.push({ from, relation: "USES_SKILL", to: `SKILL:${skillId}` });
    for (const integrationId of entity.integration_ids || []) edges.push({ from, relation: "MAY_USE_INTEGRATION", to: `INTEGRATION:${integrationId}` });
  }
  return edges;
}

function explicitEdges(snapshot) {
  return (snapshot.relationships || []).map((row) => ({ from: `${row.from_type}:${row.from_id}`, relation: row.relation, to: `${row.to_type}:${row.to_id}` }));
}

function edgeKey(edge) {
  return `${edge.from}|${edge.relation}|${edge.to}`;
}

export function relationshipEdges(snapshot) {
  const unique = new Map();
  for (const edge of [...derivedEdges(snapshot), ...explicitEdges(snapshot)]) unique.set(edgeKey(edge), edge);
  return [...unique.values()].sort((a, b) => edgeKey(a).localeCompare(edgeKey(b)));
}

export function validateRelationships(snapshot) {
  const index = buildRegistryIndex(snapshot);
  for (const edge of relationshipEdges(snapshot)) {
    const [fromType, fromId] = edge.from.split(":", 2);
    const [toType, toId] = edge.to.split(":", 2);
    if (!index.has(`${fromType}:${fromId}`)) throw new Error(`CANON_REFERENCE_MISSING:${fromId}`);
    if (!index.has(`${toType}:${toId}`)) throw new Error(`CANON_REFERENCE_MISSING:${toId}`);
  }
  return [];
}
