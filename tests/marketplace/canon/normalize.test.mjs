import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSkill, normalizeRole, normalizeIntegration, normalizeOverlay, normalizeExport } from "../../../marketplace/canon/normalize.mjs";

test("normalizeSkill preserves canonical identity and status", () => {
  const skill = normalizeSkill({ skill_id: "SKL-026", name: "Code Generation & Secure Implementation", slug: "skl-026-code-generation-secure-implementation", status: "SPECIFIED", purpose: "Creates maintainable code", common_roles: "Software implementation; prototypes", minimum_test_fixture: "Feature specification", path: "reusable_skills/x/SKILL.md" });
  assert.equal(skill.entity_type, "SKILL");
  assert.equal(skill.id, "SKL-026");
  assert.equal(skill.status, "SPECIFIED");
  assert.equal(skill.purpose, "Creates maintainable code");
});

test("normalizeRole converts booleans, ID lists and empty boundary without inference", () => {
  const role = normalizeRole({ role_id: "ESP-02", name: "Software Implementation Agent", status: "SPECIFIED", overlay: "False", provider_neutral: "True", runtime_promoted: "False", suggested_skill_ids: "SKL-028;SKL-026", suggested_integration_ids: "INT-007;INT-003", boundary: "", provisional_risk: "moderate" });
  assert.deepEqual(role.skill_ids, ["SKL-026", "SKL-028"]);
  assert.deepEqual(role.integration_ids, ["INT-003", "INT-007"]);
  assert.equal(role.overlay, false);
  assert.equal(role.provider_neutral, true);
  assert.equal(role.runtime_promoted, false);
  assert.equal(role.boundary, null);
  assert.equal(role.provisional_risk, "moderate");
});

test("normalizeIntegration and normalizeOverlay use stable canonical IDs", () => {
  assert.equal(normalizeIntegration({ integration_id: "INT-007", name: "Code repository", status: "CATEGORY_SPECIFIED" }).id, "INT-007");
  const overlay = normalizeOverlay({ role_id: "OVL-01", name: "Insurance Claims Support Agent", overlay: "True", status: "SPECIFIED", attached_to: "B; A" });
  assert.equal(overlay.entity_type, "OVERLAY");
  assert.equal(overlay.id, "OVL-01");
  assert.equal(overlay.overlay, true);
  assert.deepEqual(overlay.attached_to, ["A", "B"]);
});

test("normalizeExport rejects duplicate stable IDs within a canonical type", () => {
  const raw = { skills: [{ skill_id: "SKL-026", name: "A" }, { skill_id: "SKL-026", name: "B" }], roles: [], integrations: [], overlays: [], relationships: [] };
  assert.throws(() => normalizeExport(raw), /CANON_DUPLICATE_ID:SKL-026/);
});

test("normalizeExport sorts entities and relationship fields deterministically", () => {
  const raw = { skills: [{ skill_id: "SKL-026", name: "B" }, { skill_id: "SKL-001", name: "A" }], roles: [], integrations: [], overlays: [], relationships: [{ from_type: "role", from_id: "ESP-02", relation: "USES_SKILL", to_type: "skill", to_id: "SKL-026" }] };
  const normalized = normalizeExport(raw);
  assert.deepEqual(normalized.skills.map(x => x.id), ["SKL-001", "SKL-026"]);
  assert.deepEqual(normalized.relationships[0], { from_type: "ROLE", from_id: "ESP-02", relation: "USES_SKILL", to_type: "SKILL", to_id: "SKL-026" });
});
