import test from "node:test";
import assert from "node:assert/strict";
import { diffSnapshots, eventFingerprint } from "../../../marketplace/canon/events.mjs";

function snapshot(skills = []) {
  return { schema_version: 1, roles: [], skills, integrations: [], overlays: [], relationships: [] };
}

test("diffSnapshots emits deterministic CANON_CREATED", () => {
  const events = diffSnapshots(snapshot(), snapshot([{ entity_type: "SKILL", id: "SKL-046", version: "1.0.0", content_hash: "abc" }]));
  assert.equal(events.length, 1);
  assert.equal(events[0].event_type, "CANON_CREATED");
  assert.equal(events[0].entity_id, "SKL-046");
  assert.match(events[0].event_id, /^EVT-[A-F0-9]{24}$/);
  assert.equal(eventFingerprint(events[0]), eventFingerprint(events[0]));
});

test("diffSnapshots emits update when content hash changes", () => {
  const previous = snapshot([{ entity_type: "SKILL", id: "SKL-046", content_hash: "aaa" }]);
  const next = snapshot([{ entity_type: "SKILL", id: "SKL-046", content_hash: "bbb" }]);
  const events = diffSnapshots(previous, next);
  assert.equal(events[0].event_type, "CANON_UPDATED");
  assert.equal(events[0].previous_hash, "aaa");
  assert.equal(events[0].next_hash, "bbb");
});

test("diffSnapshots emits retired when an entity disappears", () => {
  const previous = snapshot([{ entity_type: "SKILL", id: "SKL-046", content_hash: "aaa" }]);
  const events = diffSnapshots(previous, snapshot());
  assert.equal(events[0].event_type, "CANON_RETIRED");
  assert.equal(events[0].next_hash, null);
});

test("unchanged snapshots emit no events", () => {
  const value = snapshot([{ entity_type: "SKILL", id: "SKL-046", content_hash: "aaa" }]);
  assert.deepEqual(diffSnapshots(value, structuredClone(value)), []);
});
