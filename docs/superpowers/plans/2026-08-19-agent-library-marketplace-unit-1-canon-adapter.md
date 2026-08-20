# Agent Library Marketplace Unit 1 — Canon Registry Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the approved Agentic AI Role Library exports into deterministic, machine-readable canonical snapshots, relationships, checksums, and append-only change events without making the marketplace a competing source of truth.

**Architecture:** Unit 1 is a read-only Canon adapter. It accepts explicit exported source files, normalizes stable IDs and relationships, hashes canonical records, validates references, emits deterministic projection artifacts, and compares snapshots to generate events. It writes only generated mirror data under `data/library/`; authoritative source files remain outside marketplace ownership.

**Tech Stack:** Node.js 22 ESM, `node:test`, built-in `node:crypto`, `node:fs`, `node:path`; no runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-08-19-agentic-capability-library-marketplace-design.md` plus `docs/superpowers/specs/2026-08-19-agentic-capability-library-marketplace-design-review-addendum.md`

## Global Constraints

- Human Authority → AOC Canon → BuildGraph Core → Agentic Skill OS → Marketplace Projection → Runtime Distributions.
- Unit 1 must never write to Canon.
- Stable canonical IDs are identity; filenames and display titles are not identity.
- Identical input must produce byte-stable normalized records except for explicitly excluded run metadata.
- Invalid references fail closed and do not overwrite the last-known-good snapshot.
- Machine lifecycle/status enums are uppercase canonical constants.
- Public/commercial metadata is not created in Unit 1.

---

### Task 1: Add the Canon adapter module boundary

**Files:**
- Create: `marketplace/canon/constants.mjs`
- Create: `marketplace/canon/types.mjs`
- Create: `tests/marketplace/canon/constants.test.mjs`

**Interfaces:**
- Produces: `CANON_ENTITY_TYPES`, `CANON_EVENT_TYPES`, `assertStableId(value)`, `canonicalEntityKey(entity)`.
- Consumes: none.

- [ ] **Step 1: Write the failing constants/ID tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { CANON_ENTITY_TYPES, assertStableId, canonicalEntityKey } from "../../../marketplace/canon/constants.mjs";

test("canonical entity types include marketplace-relevant classes", () => {
  assert.deepEqual(CANON_ENTITY_TYPES, [
    "CAPABILITY", "SKILL", "ROLE", "AGENT_DEFINITION", "WORKFLOW",
    "FACTORY", "INTEGRATION", "OVERLAY", "POLICY", "RUNTIME_ADAPTER",
  ]);
});

test("stable IDs are required and preserved", () => {
  assert.equal(assertStableId("SKL-026"), "SKL-026");
  assert.throws(() => assertStableId(""), /stable ID/i);
  assert.equal(canonicalEntityKey({ entity_type: "SKILL", id: "SKL-026" }), "SKILL:SKL-026");
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/marketplace/canon/constants.test.mjs`
Expected: FAIL because `marketplace/canon/constants.mjs` does not exist.

- [ ] **Step 3: Implement the constants and validators**

```js
export const CANON_ENTITY_TYPES = Object.freeze([
  "CAPABILITY", "SKILL", "ROLE", "AGENT_DEFINITION", "WORKFLOW",
  "FACTORY", "INTEGRATION", "OVERLAY", "POLICY", "RUNTIME_ADAPTER",
]);

export const CANON_EVENT_TYPES = Object.freeze([
  "CANON_CREATED", "CANON_UPDATED", "CANON_PROMOTED", "CANON_DEPRECATED",
  "CANON_RETIRED", "ROLE_SKILL_RELATION_CHANGED", "INTEGRATION_REQUIREMENT_CHANGED",
  "POLICY_CHANGED", "EVALUATION_COMPLETED", "RIGHTS_STATUS_CHANGED",
  "RUNTIME_COMPATIBILITY_CHANGED",
]);

export function assertStableId(value) {
  if (typeof value !== "string" || !/^[A-Z][A-Z0-9_-]*-\d{2,4}$/.test(value)) {
    throw new TypeError(`Invalid stable ID: ${String(value)}`);
  }
  return value;
}

export function canonicalEntityKey(entity) {
  if (!CANON_ENTITY_TYPES.includes(entity.entity_type)) throw new TypeError("Unknown canonical entity type");
  return `${entity.entity_type}:${assertStableId(entity.id)}`;
}
```

- [ ] **Step 4: Run tests**

Run: `node --test tests/marketplace/canon/constants.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add marketplace/canon tests/marketplace/canon/constants.test.mjs
git commit -m "feat(marketplace): define canonical entity contract"
```

---

### Task 2: Implement deterministic CSV/JSON source readers

**Files:**
- Create: `marketplace/canon/readers.mjs`
- Create: `tests/fixtures/canon/skills.csv`
- Create: `tests/fixtures/canon/roles.csv`
- Create: `tests/marketplace/canon/readers.test.mjs`

**Interfaces:**
- Produces: `readCsv(text) -> Array<Record<string,string>>`, `readJson(text)`, `loadCanonExport(dir) -> {roles, skills, integrations, overlays, relationships}`.
- Consumes: filesystem paths supplied by caller.

- [ ] **Step 1: Write failing parser tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readCsv } from "../../../marketplace/canon/readers.mjs";

test("readCsv preserves quoted commas and headers", () => {
  const rows = readCsv('skill_id,name,purpose\nSKL-001,"Structured Intake, Normalization","Normalize input"\n');
  assert.deepEqual(rows, [{ skill_id: "SKL-001", name: "Structured Intake, Normalization", purpose: "Normalize input" }]);
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `node --test tests/marketplace/canon/readers.test.mjs`
Expected: FAIL because reader module is absent.

- [ ] **Step 3: Implement an RFC4180-safe small CSV parser and export loader**

Use a character-state parser; do not split on commas. `loadCanonExport(dir)` must require `roles.csv`, `skills.csv`, `integrations.csv`, `overlays.csv`, and `relationships.csv`, and throw `CANON_SOURCE_MISSING:<filename>` if any are absent.

- [ ] **Step 4: Add fixture coverage for multiline/quoted fields and missing files**

```js
assert.throws(() => loadCanonExport("tests/fixtures/canon-missing"), /CANON_SOURCE_MISSING/);
```

- [ ] **Step 5: Run tests**

Run: `node --test tests/marketplace/canon/readers.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add marketplace/canon/readers.mjs tests/fixtures/canon tests/marketplace/canon/readers.test.mjs
git commit -m "feat(marketplace): read canonical export files"
```

---

### Task 3: Normalize Roles, Skills, Integrations, and overlays

**Files:**
- Create: `marketplace/canon/normalize.mjs`
- Create: `tests/marketplace/canon/normalize.test.mjs`

**Interfaces:**
- Produces: `normalizeSkill(row)`, `normalizeRole(row)`, `normalizeIntegration(row)`, `normalizeOverlay(row)`, `normalizeExport(raw)`.
- Consumes: row objects returned by `readers.mjs`.

- [ ] **Step 1: Write failing normalization tests**

```js
const skill = normalizeSkill({
  skill_id: "SKL-026",
  name: "Code Generation & Secure Implementation",
  status: "SPECIFIED",
  purpose: "Creates maintainable code",
});
assert.equal(skill.entity_type, "SKILL");
assert.equal(skill.id, "SKL-026");
assert.equal(skill.status, "SPECIFIED");
assert.deepEqual(Object.keys(skill).sort(), [...Object.keys(skill)].sort());
```

Also assert that duplicate `SKL-026` rows throw `CANON_DUPLICATE_ID:SKL-026`.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/canon/normalize.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement normalization**

Normalize semicolon-separated ID fields into sorted arrays, booleans into booleans, empty strings into `null`, preserve stable IDs, and sort entities by `(entity_type, id)` before serialization. Do not infer missing authority, risk, or integrations.

- [ ] **Step 4: Add no-inference tests**

```js
assert.equal(normalizeRole({ role_id: "ESP-02", name: "Software Implementation Agent", boundary: "" }).boundary, null);
```

- [ ] **Step 5: Run tests**

Run: `node --test tests/marketplace/canon/normalize.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add marketplace/canon/normalize.mjs tests/marketplace/canon/normalize.test.mjs
git commit -m "feat(marketplace): normalize canonical registry records"
```

---

### Task 4: Resolve and validate canonical relationships

**Files:**
- Create: `marketplace/canon/relationships.mjs`
- Create: `tests/marketplace/canon/relationships.test.mjs`

**Interfaces:**
- Produces: `buildRegistryIndex(entities)`, `validateRelationships(snapshot)`, `relationshipEdges(snapshot)`.
- Consumes: normalized snapshot from Task 3.

- [ ] **Step 1: Write failing relationship tests**

```js
const snapshot = {
  skills: [{ entity_type: "SKILL", id: "SKL-026" }],
  roles: [{ entity_type: "ROLE", id: "ESP-02", skill_ids: ["SKL-026"] }],
  integrations: [], overlays: [], relationships: [],
};
assert.deepEqual(validateRelationships(snapshot), []);
assert.deepEqual(relationshipEdges(snapshot), [
  { from: "ROLE:ESP-02", relation: "USES_SKILL", to: "SKILL:SKL-026" },
]);
```

Add a missing-skill case and expect `CANON_REFERENCE_MISSING:SKL-999`.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/canon/relationships.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement strict resolution**

Do not create placeholders for missing IDs. Return sorted edges for deterministic output.

- [ ] **Step 4: Run tests**

Run: `node --test tests/marketplace/canon/relationships.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add marketplace/canon/relationships.mjs tests/marketplace/canon/relationships.test.mjs
git commit -m "feat(marketplace): validate canonical relationships"
```

---

### Task 5: Add canonical hashing and deterministic snapshot serialization

**Files:**
- Create: `marketplace/canon/hash.mjs`
- Create: `marketplace/canon/snapshot.mjs`
- Create: `tests/marketplace/canon/snapshot.test.mjs`

**Interfaces:**
- Produces: `stableStringify(value)`, `sha256(value)`, `buildSnapshot(exportData)`, `buildChecksums(snapshot)`.
- Consumes: normalized, validated canonical data.

- [ ] **Step 1: Write failing determinism tests**

```js
assert.equal(stableStringify({ b: 2, a: 1 }), '{"a":1,"b":2}');
assert.equal(sha256({ a: 1 }), sha256({ a: 1 }));
assert.equal(sha256({ a: 1 }).length, 64);
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/canon/snapshot.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement canonical serializer and SHA-256 hashing**

Use recursively sorted object keys and preserve array order only after callers sort semantic collections.

- [ ] **Step 4: Add byte-stability fixture test**

Build the same snapshot twice from fixture files and assert exact string equality.

- [ ] **Step 5: Run tests**

Run: `node --test tests/marketplace/canon/snapshot.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add marketplace/canon/hash.mjs marketplace/canon/snapshot.mjs tests/marketplace/canon/snapshot.test.mjs
git commit -m "feat(marketplace): hash deterministic canon snapshots"
```

---

### Task 6: Generate append-only change events

**Files:**
- Create: `marketplace/canon/events.mjs`
- Create: `tests/marketplace/canon/events.test.mjs`

**Interfaces:**
- Produces: `diffSnapshots(previous, next) -> CanonEvent[]`, `eventFingerprint(event)`.
- Consumes: two canonical snapshots.

- [ ] **Step 1: Write failing create/update/retire tests**

```js
const events = diffSnapshots(
  { skills: [] },
  { skills: [{ entity_type: "SKILL", id: "SKL-046", version: "1.0.0", content_hash: "abc" }] },
);
assert.equal(events[0].event_type, "CANON_CREATED");
assert.equal(events[0].entity_id, "SKL-046");
```

Also test unchanged snapshots emit `[]`.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/canon/events.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement deterministic event IDs**

Generate event IDs from a SHA-256 fingerprint of event type, entity type, stable ID, previous hash, and next hash. Store `occurred_at` only in the invocation envelope written by the CLI so pure diff tests remain deterministic.

- [ ] **Step 4: Run tests**

Run: `node --test tests/marketplace/canon/events.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add marketplace/canon/events.mjs tests/marketplace/canon/events.test.mjs
git commit -m "feat(marketplace): emit canonical change events"
```

---

### Task 7: Add the import CLI and last-known-good write contract

**Files:**
- Create: `marketplace/bin/import-canon.mjs`
- Create: `data/library/.gitkeep`
- Create: `tests/marketplace/canon/import-cli.test.mjs`
- Modify: `.gitignore`

**Interfaces:**
- CLI: `node marketplace/bin/import-canon.mjs --source <dir> --out data/library`
- Produces: `canon.snapshot.json`, `canon.relationships.json`, `canon.checksums.json`, `canon.events.jsonl`.

- [ ] **Step 1: Write failing CLI integration test**

Use `spawnSync(process.execPath, ["marketplace/bin/import-canon.mjs", "--source", fixtureDir, "--out", tempDir])` and assert the four outputs exist and parse.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/canon/import-cli.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement atomic output writes**

Write each candidate file to `<name>.tmp`, fsync/close, then rename only after all validation succeeds. If validation fails, leave existing output files untouched and exit nonzero.

- [ ] **Step 4: Add last-known-good regression test**

Seed an existing `canon.snapshot.json`, run with broken input, then assert the seeded file is unchanged byte-for-byte.

- [ ] **Step 5: Run all Unit 1 tests**

Run: `node --test tests/marketplace/canon/*.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add marketplace/bin data/library tests/marketplace/canon .gitignore
git commit -m "feat(marketplace): add fail-closed canon import CLI"
```

---

### Task 8: Add Unit 1 CI and full-reference acceptance test

**Files:**
- Create: `.github/workflows/marketplace-canon.yml`
- Create: `tests/marketplace/canon/full-reference.test.mjs`
- Modify: `README.md`

**Interfaces:**
- CI executes the Unit 1 test suite on Node 22.
- Full-reference test consumes the approved exported canonical mirror fixture supplied to CI.

- [ ] **Step 1: Write the full-reference acceptance test**

```js
test("full canonical export contains unique public identities", () => {
  const snapshot = JSON.parse(readFileSync("data/library/canon.snapshot.json", "utf8"));
  const ids = [...snapshot.roles, ...snapshot.skills].map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(snapshot.roles.length > 0);
  assert.ok(snapshot.skills.length > 0);
});
```

Do not hard-code legacy counts in the parser; counts are validation observations supplied by the approved export receipt.

- [ ] **Step 2: Add workflow**

```yaml
name: Marketplace Canon
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: node --test tests/marketplace/canon/*.test.mjs
```

- [ ] **Step 3: Run complete repository tests locally**

Run: `node --test tests/*.test.mjs tests/marketplace/canon/*.test.mjs`
Expected: PASS.

- [ ] **Step 4: Verify Unit 1 Definition of Done**

Confirm: deterministic snapshot, strict references, unique stable IDs, no upstream writes, atomic failure behavior, event generation, and CI pass.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/marketplace-canon.yml tests/marketplace/canon/full-reference.test.mjs README.md
git commit -m "ci(marketplace): gate canonical registry adapter"
```
