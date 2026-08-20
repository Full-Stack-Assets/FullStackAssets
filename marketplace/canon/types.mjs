/**
 * @typedef {"CAPABILITY"|"SKILL"|"ROLE"|"AGENT_DEFINITION"|"WORKFLOW"|"FACTORY"|"INTEGRATION"|"OVERLAY"|"POLICY"|"RUNTIME_ADAPTER"} CanonEntityType
 * @typedef {{entity_type: CanonEntityType, id: string, version?: string|null, content_hash?: string|null}} CanonEntity
 * @typedef {{event_id: string, event_type: string, entity_type: CanonEntityType, entity_id: string, previous_hash: string|null, next_hash: string|null}} CanonEvent
 */
export const CANON_TYPES_VERSION = 1;
