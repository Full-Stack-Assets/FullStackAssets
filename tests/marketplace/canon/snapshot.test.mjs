import test from "node:test";
import assert from "node:assert/strict";
import { stableStringify, sha256 } from "../../../marketplace/canon/hash.mjs";
import { buildSnapshot, buildChecksums } from "../../../marketplace/canon/snapshot.mjs";

const exportData = {
  roles: [{ role_id: "ESP-02", name: "Software Implementation Agent", suggested_skill_ids: "SKL-026", suggested_integration_ids: "INT-007", status: "SPECIFIED" }],
  skills: [{ skill_id: "SKL-026", name: "Code Generation", status: "SPECIFIED" }],
  integrations: [{ integration_id: "INT-007", name: "Code repository", status: "CATEGORY_SPECIFIED" }],
  overlays: [],
  relationships: [{ from_type: "role", from_id: "ESP-02", relation: "USES_SKILL", to_type: "skill", to_id: "SKL-026" }],
};

test("stableStringify recursively sorts object keys", () => {
  assert.equal(stableStringify({ b: 2, a: { d: 4, c: 3 } }), '{"a":{"c":3,"d":4},"b":2}');
});

test("sha256 is deterministic and returns lowercase hex", () => {
  assert.equal(sha256({ a: 1 }), sha256({ a: 1 }));
  assert.match(sha256({ a: 1 }), /^[a-f0-9]{64}$/);
});

test("buildSnapshot is byte-stable and hashes each canonical entity", () => {
  const one = buildSnapshot(exportData);
  const two = buildSnapshot(structuredClone(exportData));
  assert.equal(stableStringify(one), stableStringify(two));
  assert.match(one.skills[0].content_hash, /^[a-f0-9]{64}$/);
  assert.match(one.roles[0].content_hash, /^[a-f0-9]{64}$/);
  assert.equal(one.schema_version, 1);
});

test("buildChecksums exposes entity and snapshot hashes", () => {
  const snapshot = buildSnapshot(exportData);
  const checksums = buildChecksums(snapshot);
  assert.equal(checksums.entities["SKILL:SKL-026"], snapshot.skills[0].content_hash);
  assert.match(checksums.snapshot, /^[a-f0-9]{64}$/);
});
