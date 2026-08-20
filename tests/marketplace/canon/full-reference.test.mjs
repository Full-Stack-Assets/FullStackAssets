import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const reference = JSON.parse(readFileSync(new URL("../../fixtures/canon/full-reference-index.json", import.meta.url), "utf8"));

test("approved full canonical export contains unique Role and Skill public identities", () => {
  const identities = [
    ...reference.roles.map(id => `ROLE:${id}`),
    ...reference.skills.map(id => `SKILL:${id}`),
  ];
  assert.equal(new Set(identities).size, identities.length);
  assert.ok(reference.roles.length > 0);
  assert.ok(reference.skills.length > 0);
  assert.match(reference.snapshot_hash, /^[a-f0-9]{64}$/);
});

test("approved full canonical export includes integration, overlay, and relationship evidence", () => {
  assert.ok(reference.integrations.length > 0);
  assert.ok(reference.overlays.length > 0);
  assert.equal(new Set(reference.integrations).size, reference.integrations.length);
  assert.equal(new Set(reference.overlays).size, reference.overlays.length);
  assert.ok(reference.relationship_count > 0);
  assert.match(reference.relationship_hash, /^[a-f0-9]{64}$/);
});
