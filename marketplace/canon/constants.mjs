export const CANON_ENTITY_TYPES = Object.freeze([
  "CAPABILITY", "SKILL", "ROLE", "AGENT_DEFINITION", "WORKFLOW",
  "FACTORY", "INTEGRATION", "OVERLAY", "POLICY", "RUNTIME_ADAPTER",
]);

export const CANON_EVENT_TYPES = Object.freeze([
  "CANON_CREATED", "CANON_UPDATED", "CANON_PROMOTED", "CANON_DEPRECATED",
  "CANON_RETIRED", "ROLE_SKILL_RELATION_CHANGED", "INTEGRATION_REQUIREMENT_CHANGED",
  "POLICY_CHANGED", "EVALUATION_COMPLETED", "RIGHTS_STATUS_CHANGED",
  "RUNTIME_COMPATIBILITY_CHANGED",
]);

export function assertStableId(value) {
  if (typeof value !== "string" || !/^[A-Z][A-Z0-9_-]*-\d{2,4}$/.test(value)) {
    throw new TypeError(`Invalid stable ID: ${String(value)}`);
  }
  return value;
}

export function canonicalEntityKey(entity) {
  if (!entity || !CANON_ENTITY_TYPES.includes(entity.entity_type)) {
    throw new TypeError("Unknown canonical entity type");
  }
  return `${entity.entity_type}:${assertStableId(entity.id)}`;
}
