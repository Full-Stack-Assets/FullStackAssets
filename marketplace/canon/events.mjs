import { sha256 } from "./hash.mjs";
import { canonicalEntityKey } from "./constants.mjs";

function entityMap(snapshot) {
  const map = new Map();
  for (const group of [snapshot.roles || [], snapshot.skills || [], snapshot.integrations || [], snapshot.overlays || []]) {
    for (const entity of group) map.set(canonicalEntityKey(entity), entity);
  }
  return map;
}

function baseEvent(eventType, previous, next) {
  const entity = next || previous;
  const event = {
    event_type: eventType,
    entity_type: entity.entity_type,
    entity_id: entity.id,
    previous_hash: previous?.content_hash ?? null,
    next_hash: next?.content_hash ?? null,
    previous_version: previous?.version ?? null,
    next_version: next?.version ?? null,
  };
  return { ...event, event_id: `EVT-${eventFingerprint(event).slice(0, 24).toUpperCase()}` };
}

export function eventFingerprint(event) {
  return sha256({
    event_type: event.event_type,
    entity_type: event.entity_type,
    entity_id: event.entity_id,
    previous_hash: event.previous_hash ?? null,
    next_hash: event.next_hash ?? null,
  });
}

export function diffSnapshots(previous = {}, next = {}) {
  const before = entityMap(previous);
  const after = entityMap(next);
  const keys = [...new Set([...before.keys(), ...after.keys()])].sort();
  const events = [];
  for (const key of keys) {
    const prev = before.get(key);
    const nxt = after.get(key);
    if (!prev && nxt) events.push(baseEvent("CANON_CREATED", null, nxt));
    else if (prev && !nxt) events.push(baseEvent("CANON_RETIRED", prev, null));
    else if (prev.content_hash !== nxt.content_hash) {
      let type = "CANON_UPDATED";
      if (nxt.status === "DEPRECATED" && prev.status !== "DEPRECATED") type = "CANON_DEPRECATED";
      if (nxt.status === "RETIRED" && prev.status !== "RETIRED") type = "CANON_RETIRED";
      if (["APPROVED", "PROMOTED"].includes(nxt.status) && !["APPROVED", "PROMOTED"].includes(prev.status)) type = "CANON_PROMOTED";
      events.push(baseEvent(type, prev, nxt));
    }
  }
  return events;
}
