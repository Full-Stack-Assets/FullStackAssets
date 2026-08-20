import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readCsv, loadCanonExport } from "../../../marketplace/canon/readers.mjs";

test("readCsv preserves quoted commas and headers", () => {
  const rows = readCsv('skill_id,name,purpose\nSKL-001,"Structured Intake, Normalization","Normalize input"\n');
  assert.deepEqual(rows, [{ skill_id: "SKL-001", name: "Structured Intake, Normalization", purpose: "Normalize input" }]);
});

test("readCsv preserves quoted multiline fields and escaped quotes", () => {
  const rows = readCsv('id,notes\nOVL-01,"line one\nline two with ""quotes"""\n');
  assert.deepEqual(rows, [{ id: "OVL-01", notes: 'line one\nline two with "quotes"' }]);
});

test("loadCanonExport requires all five registry files", () => {
  const dir = mkdtempSync(join(tmpdir(), "canon-missing-"));
  writeFileSync(join(dir, "roles.csv"), "role_id,name\nESP-02,Software Implementation Agent\n");
  assert.throws(() => loadCanonExport(dir), /CANON_SOURCE_MISSING:skills\.csv/);
});

test("loadCanonExport loads all registry groups", () => {
  const dir = mkdtempSync(join(tmpdir(), "canon-export-"));
  const files = {
    "roles.csv": "role_id,name\nESP-02,Software Implementation Agent\n",
    "skills.csv": "skill_id,name\nSKL-026,Code Generation\n",
    "integrations.csv": "integration_id,name\nINT-007,Code repository\n",
    "overlays.csv": "overlay_id,name\nOVL-01,Insurance Claims Support Agent\n",
    "relationships.csv": "from_id,relation,to_id\nESP-02,USES_SKILL,SKL-026\n",
  };
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  const loaded = loadCanonExport(dir);
  assert.equal(loaded.roles[0].role_id, "ESP-02");
  assert.equal(loaded.skills[0].skill_id, "SKL-026");
  assert.equal(loaded.integrations[0].integration_id, "INT-007");
  assert.equal(loaded.overlays[0].overlay_id, "OVL-01");
  assert.equal(loaded.relationships[0].relation, "USES_SKILL");
});
