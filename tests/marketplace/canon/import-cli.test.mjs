import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function makeExport(dir, { broken = false } = {}) {
  mkdirSync(dir, { recursive: true });
  const files = {
    "roles.csv": broken ? "role_id,name,suggested_skill_ids,suggested_integration_ids,status\nESP-02,Software Implementation Agent,SKL-999,INT-007,SPECIFIED\n" : "role_id,name,suggested_skill_ids,suggested_integration_ids,status\nESP-02,Software Implementation Agent,SKL-026,INT-007,SPECIFIED\n",
    "skills.csv": "skill_id,name,status\nSKL-026,Code Generation,SPECIFIED\n",
    "integrations.csv": "integration_id,name,status\nINT-007,Code repository,CATEGORY_SPECIFIED\n",
    "overlays.csv": "role_id,name,overlay,status\nOVL-01,Insurance Claims Support Agent,True,SPECIFIED\n",
    "relationships.csv": "from_type,from_id,relation,to_type,to_id\nrole,ESP-02,USES_SKILL,skill,SKL-026\n",
  };
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
}

function run(source, out) {
  return spawnSync(process.execPath, ["marketplace/bin/import-canon.mjs", "--source", source, "--out", out], { cwd: new URL("../../../", import.meta.url).pathname, encoding: "utf8" });
}

test("import CLI writes the four deterministic projection outputs", () => {
  const root = mkdtempSync(join(tmpdir(), "canon-cli-"));
  const source = join(root, "source");
  const out = join(root, "out");
  makeExport(source);
  const result = run(source, out);
  assert.equal(result.status, 0, result.stderr);
  for (const file of ["canon.snapshot.json", "canon.relationships.json", "canon.checksums.json", "canon.events.jsonl"]) assert.equal(existsSync(join(out, file)), true, file);
  const snapshot = JSON.parse(readFileSync(join(out, "canon.snapshot.json"), "utf8"));
  assert.equal(snapshot.roles[0].id, "ESP-02");
  assert.ok(readFileSync(join(out, "canon.events.jsonl"), "utf8").includes("CANON_CREATED"));
});

test("failed import preserves the last-known-good snapshot byte-for-byte", () => {
  const root = mkdtempSync(join(tmpdir(), "canon-cli-lkg-"));
  const source = join(root, "source");
  const broken = join(root, "broken");
  const out = join(root, "out");
  makeExport(source);
  assert.equal(run(source, out).status, 0);
  const before = readFileSync(join(out, "canon.snapshot.json"), "utf8");
  makeExport(broken, { broken: true });
  const result = run(broken, out);
  assert.notEqual(result.status, 0);
  assert.equal(readFileSync(join(out, "canon.snapshot.json"), "utf8"), before);
});

test("second identical import appends no duplicate events", () => {
  const root = mkdtempSync(join(tmpdir(), "canon-cli-idempotent-"));
  const source = join(root, "source");
  const out = join(root, "out");
  makeExport(source);
  assert.equal(run(source, out).status, 0);
  const first = readFileSync(join(out, "canon.events.jsonl"), "utf8");
  assert.equal(run(source, out).status, 0);
  const second = readFileSync(join(out, "canon.events.jsonl"), "utf8");
  assert.equal(second, first);
});
