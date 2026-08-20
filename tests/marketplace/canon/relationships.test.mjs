import test from "node:test";
import assert from "node:assert/strict";
import { buildRegistryIndex, validateRelationships, relationshipEdges } from "../../../marketplace/canon/relationships.mjs";

const snapshot = {
  skills: [{ entity_type: "SKILL", id: "SKL-026" }],
  roles: [{ entity_type: "ROLE", id: "ESP-02", skill_ids: ["SKL-026"], integration_ids: ["INT-007"] }],
  integrations: [{ entity_type: "INTEGRATION", id: "INT-007" }],
  overlays: [],
  relationships: [],
};

test("buildRegistryIndex indexes canonical keys", () => {
  const index = buildRegistryIndex(snapshot);
  assert.equal(index.get("ROLE:ESP-02").id, "ESP-02");
  assert.equal(index.get("SKILL:SKL-026").id, "SKL-026");
});

test("validateRelationships accepts resolved embedded references", () => assert.deepEqual(validateRelationships(snapshot), []));

test("relationshipEdges derives deterministic embedded edges", () => {
  assert.deepEqual(relationshipEdges(snapshot), [
    { from: "ROLE:ESP-02", relation: "MAY_USE_INTEGRATION", to: "INTEGRATION:INT-007" },
    { from: "ROLE:ESP-02", relation: "USES_SKILL", to: "SKILL:SKL-026" },
  ]);
});

test("validateRelationships rejects missing referenced IDs", () => {
  const broken = structuredClone(snapshot);
  broken.roles[0].skill_ids = ["SKL-999"];
  assert.throws(() => validateRelationships(broken), /CANON_REFERENCE_MISSING:SKL-999/);
});

test("relationshipEdges preserves explicit relationships without duplicates", () => {
  const explicit = structuredClone(snapshot);
  explicit.relationships = [{ from_type: "ROLE", from_id: "ESP-02", relation: "USES_SKILL", to_type: "SKILL", to_id: "SKL-026" }];
  assert.deepEqual(relationshipEdges(explicit), [
    { from: "ROLE:ESP-02", relation: "MAY_USE_INTEGRATION", to: "INTEGRATION:INT-007" },
    { from: "ROLE:ESP-02", relation: "USES_SKILL", to: "SKILL:SKL-026" },
  ]);
});
