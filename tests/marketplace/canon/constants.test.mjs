import test from "node:test";
import assert from "node:assert/strict";
import { CANON_ENTITY_TYPES, CANON_EVENT_TYPES, assertStableId, canonicalEntityKey } from "../../../marketplace/canon/constants.mjs";

test("canonical entity types include marketplace-relevant classes", () => {
  assert.deepEqual(CANON_ENTITY_TYPES, [
    "CAPABILITY", "SKILL", "ROLE", "AGENT_DEFINITION", "WORKFLOW",
    "FACTORY", "INTEGRATION", "OVERLAY", "POLICY", "RUNTIME_ADAPTER",
  ]);
});

test("canonical event types include the frozen event vocabulary", () => {
  assert.ok(CANON_EVENT_TYPES.includes("CANON_CREATED"));
  assert.ok(CANON_EVENT_TYPES.includes("RUNTIME_COMPATIBILITY_CHANGED"));
});

test("stable IDs are required and preserved", () => {
  assert.equal(assertStableId("SKL-026"), "SKL-026");
  assert.throws(() => assertStableId(""), /stable ID/i);
  assert.equal(canonicalEntityKey({ entity_type: "SKILL", id: "SKL-026" }), "SKILL:SKL-026");
});
