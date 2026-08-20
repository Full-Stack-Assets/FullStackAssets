# Agent Library Marketplace Unit 2 — Marketplace Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Project canonical snapshots/events into immutable marketplace Products and ProductVersions with deterministic state transitions, publication policy, reference-only visibility, outbox events, and idempotent processing.

**Architecture:** Unit 2 is pure domain logic plus SQL schema. The Canon adapter from Unit 1 is input-only. Core marketplace functions operate against an injected repository interface so domain tests use an in-memory repository and later Units attach PostgreSQL. Published versions are immutable; reference-only catalog entries and commercial products are distinct states.

**Tech Stack:** Node.js 22 ESM, `node:test`, PostgreSQL-compatible SQL migrations, pure domain functions with repository adapters.

**Spec:** `docs/superpowers/specs/2026-08-19-agentic-capability-library-marketplace-design.md` plus review addendum.

## Global Constraints

- Canon is authoritative; Unit 2 may only project downstream.
- `REFERENCE_ONLY` is distinct from `FREE` and `PAID`.
- Published ProductVersions are immutable.
- Payment providers do not create entitlements in Unit 2.
- Machine enums are uppercase.
- Projection identity is `(entity_type, entity_id, canonical_version, content_hash, event_id)`.
- Duplicate events are no-ops; out-of-order events never regress the active public pointer.
- Paid, major, Moderate/High/Restricted, I3/I4, sensitive, policy-exception, rights-uncertain, provenance-incomplete, and new-third-party publications require Human Authority.

---

### Task 1: Define marketplace enums and domain records

**Files:**
- Create: `marketplace/core/constants.mjs`
- Create: `marketplace/core/records.mjs`
- Create: `tests/marketplace/core/records.test.mjs`

**Interfaces:**
- Produces: `PRODUCT_TYPES`, `COMMERCIAL_STATES`, `VERSION_STATES`, `COMPATIBILITY_STATES`, `createProduct(input)`, `createProductVersion(input)`.

- [ ] **Step 1: Write failing enum/record tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { COMMERCIAL_STATES, createProductVersion } from "../../../marketplace/core/records.mjs";

test("reference-only is a first-class commercial state", () => {
  assert.ok(COMMERCIAL_STATES.includes("REFERENCE_ONLY"));
});

test("product versions require canonical hashes", () => {
  assert.throws(() => createProductVersion({ product_id: "PRD-001", version: "1.0.0", canonical_snapshot: { refs: [] } }), /hash/i);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/core/records.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement enums and constructors**

Use uppercase persisted values. `createProductVersion` must freeze the returned object in tests and require at least one canonical ref/hash/version tuple.

- [ ] **Step 4: Run tests**

Run: `node --test tests/marketplace/core/records.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add marketplace/core tests/marketplace/core/records.test.mjs
git commit -m "feat(marketplace): define core marketplace records"
```

---

### Task 2: Add the relational schema and immutability constraints

**Files:**
- Create: `marketplace/db/migrations/001_marketplace_core.sql`
- Create: `tests/marketplace/core/schema-contract.test.mjs`

**Interfaces:**
- Produces SQL tables: `publishers`, `products`, `product_versions`, `product_components`, `runtime_distributions`, `evaluation_records`, `publication_records`, `offers`, `license_policies`, `outbox_events`, `projection_receipts`.

- [ ] **Step 1: Write failing SQL contract test**

```js
const sql = readFileSync("marketplace/db/migrations/001_marketplace_core.sql", "utf8");
assert.match(sql, /CREATE TABLE product_versions/i);
assert.match(sql, /UNIQUE\s*\(product_id,\s*version\)/i);
assert.match(sql, /canonical_hash/i);
assert.match(sql, /CREATE TABLE outbox_events/i);
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/core/schema-contract.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Write the migration**

Require primary keys, foreign keys, uppercase `CHECK` constraints, unique `(product_id, version)`, unique projection fingerprint, and `created_at`/`updated_at`. Add a database trigger/function that rejects `UPDATE`/`DELETE` to rows in `product_versions` where `publication_state='PUBLISHED'`, except updates to a separate mutable `product_version_availability` table.

- [ ] **Step 4: Add availability table contract**

```sql
CREATE TABLE product_version_availability (
  product_version_id TEXT PRIMARY KEY REFERENCES product_versions(id),
  availability_state TEXT NOT NULL CHECK (availability_state IN ('ACTIVE','DELISTED','SUSPENDED','SECURITY_BLOCKED','LEGAL_HOLD','RETIRED')),
  reason_code TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 5: Run contract tests**

Run: `node --test tests/marketplace/core/schema-contract.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add marketplace/db/migrations/001_marketplace_core.sql tests/marketplace/core/schema-contract.test.mjs
git commit -m "feat(marketplace): add immutable marketplace schema"
```

---

### Task 3: Define repository contract and in-memory implementation

**Files:**
- Create: `marketplace/core/repository.mjs`
- Create: `marketplace/core/memory-repository.mjs`
- Create: `tests/marketplace/core/repository.test.mjs`

**Interfaces:**
- Produces `MarketplaceRepository` methods:
  - `getProjectionReceipt(fingerprint)`
  - `putProjectionReceipt(receipt)`
  - `getProductByCanonicalRef(ref)`
  - `insertProduct(product)`
  - `insertProductVersion(version)`
  - `listProductVersions(productId)`
  - `setAvailability(productVersionId, state, reason)`
  - `appendOutbox(event)`
  - `transaction(fn)`

- [ ] **Step 1: Write transaction/idempotency tests**

```js
const repo = createMemoryRepository();
await repo.transaction(async (tx) => {
  await tx.insertProduct({ id: "PRD-001", canonical_refs: ["SKL-026"] });
  await tx.appendOutbox({ id: "OB-1", type: "PRODUCT_CREATED" });
});
assert.equal((await repo.listOutbox()).length, 1);
```

Add a test that a thrown error inside `transaction` leaves both collections unchanged.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/core/repository.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement repository and rollback semantics**

The memory repository copies state before transaction and commits only on successful return.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/core/repository.test.mjs
git add marketplace/core/repository.mjs marketplace/core/memory-repository.mjs tests/marketplace/core/repository.test.mjs
git commit -m "feat(marketplace): add core repository contract"
```

---

### Task 4: Implement Canon-to-Product projection

**Files:**
- Create: `marketplace/core/projector.mjs`
- Create: `tests/marketplace/core/projector.test.mjs`

**Interfaces:**
- Produces: `projectCanonEvent(repo, event, canonicalEntity) -> {status, product_id, product_version_id}`.
- Consumes: Unit 1 canonical event/entity and repository contract.

- [ ] **Step 1: Write failing new-volume test**

```js
const result = await projectCanonEvent(repo, {
  id: "EVT-1", event_type: "CANON_CREATED", entity_type: "SKILL", entity_id: "SKL-046",
  new_version: "1.0.0", content_hash: "abc",
}, { id: "SKL-046", entity_type: "SKILL", name: "Repository Archaeology", version: "1.0.0", content_hash: "abc" });
assert.equal(result.status, "CREATED");
assert.ok(await repo.getProductByCanonicalRef("SKL-046"));
```

- [ ] **Step 2: Add duplicate-event test**

Process the same event twice and assert only one ProductVersion and one projection receipt exist.

- [ ] **Step 3: Run and verify failure**

Run: `node --test tests/marketplace/core/projector.test.mjs`
Expected: FAIL.

- [ ] **Step 4: Implement projector**

Rules: first projection creates a Product in `REFERENCE_ONLY` by default; canonical updates create a new ProductVersion draft; do not create Offers; use deterministic product ID `PRD-${sha256(canonicalRef).slice(0,12).toUpperCase()}`; never mutate an existing published version.

- [ ] **Step 5: Run tests and commit**

```bash
node --test tests/marketplace/core/projector.test.mjs
git add marketplace/core/projector.mjs tests/marketplace/core/projector.test.mjs
git commit -m "feat(marketplace): project canon into product drafts"
```

---

### Task 5: Implement change severity classification

**Files:**
- Create: `marketplace/core/change-classifier.mjs`
- Create: `tests/marketplace/core/change-classifier.test.mjs`

**Interfaces:**
- Produces: `classifyCanonicalChange(previousEntity, nextEntity) -> PATCH | MINOR | MAJOR`.

- [ ] **Step 1: Write severity fixtures**

```js
assert.equal(classifyCanonicalChange({description:"A"}, {description:"B"}), "PATCH");
assert.equal(classifyCanonicalChange({outputs:["a"]}, {outputs:["a","b"]}), "MINOR");
assert.equal(classifyCanonicalChange({integration_ids:["INT-007"]}, {integration_ids:["INT-007","INT-016"]}), "MAJOR");
assert.equal(classifyCanonicalChange({risk_tier:"LOW"}, {risk_tier:"HIGH"}), "MAJOR");
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/core/change-classifier.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement field-policy map**

Treat authority, prohibited actions, data classifications, risk tier, integrations, permission tier, external action, safety boundaries, and breaking schemas as MAJOR. Additive optional outputs/runtime compatibility are MINOR. Copy/description/nonfunctional metadata are PATCH.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/core/change-classifier.test.mjs
git add marketplace/core/change-classifier.mjs tests/marketplace/core/change-classifier.test.mjs
git commit -m "feat(marketplace): classify canonical version impact"
```

---

### Task 6: Implement publication state machine and policy

**Files:**
- Create: `marketplace/core/state-machine.mjs`
- Create: `marketplace/core/publication-policy.mjs`
- Create: `tests/marketplace/core/publication-policy.test.mjs`

**Interfaces:**
- Produces: `transitionVersion(current, event)`, `publicationDecision(context) -> {decision:'AUTO'|'HUMAN_REVIEW'|'BLOCK', reasons:[]}`.

- [ ] **Step 1: Write policy tests**

```js
assert.deepEqual(publicationDecision({
  risk_tier:"LOW", commercial_state:"FREE", change_severity:"PATCH",
  provenance_complete:true, rights_known:true, evaluation_passed:true,
  new_authority:false, publisher_auto_eligible:true,
}), { decision:"AUTO", reasons:[] });

assert.equal(publicationDecision({
  risk_tier:"HIGH", commercial_state:"PAID", change_severity:"MAJOR",
  provenance_complete:true, rights_known:true, evaluation_passed:true,
  new_authority:true, publisher_auto_eligible:true,
}).decision, "HUMAN_REVIEW");
```

- [ ] **Step 2: Add invalid transition test**

Assert `PUBLISHED -> DRAFT` throws `INVALID_VERSION_TRANSITION`.

- [ ] **Step 3: Implement exact transition table and policy reasons**

Return machine-readable reasons such as `PAID_ACTIVATION_REQUIRES_HUMAN`, `HIGH_RISK_REQUIRES_HUMAN`, `PROVENANCE_INCOMPLETE`, `EVALUATION_FAILED`.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/core/publication-policy.test.mjs
git add marketplace/core/state-machine.mjs marketplace/core/publication-policy.mjs tests/marketplace/core/publication-policy.test.mjs
git commit -m "feat(marketplace): enforce publication policy"
```

---

### Task 7: Add public reference projection policy

**Files:**
- Create: `marketplace/core/reference-policy.mjs`
- Create: `tests/marketplace/core/reference-policy.test.mjs`

**Interfaces:**
- Produces: `referenceVisibilityDecision(entity) -> {public:boolean, fields:string[], reasons:string[]}`.

- [ ] **Step 1: Write private-field exclusion test**

```js
const decision = referenceVisibilityDecision({
  id:"ESP-02", status:"APPROVED", provenance_complete:true,
  public_metadata:{name:"Software Implementation Agent"},
  private_fields:{security_findings:["secret"]},
});
assert.equal(decision.public, true);
assert.ok(!decision.fields.includes("security_findings"));
```

- [ ] **Step 2: Add restricted-metadata block test**

Assert an entity marked `public_metadata_classification:"RESTRICTED"` is not projected publicly.

- [ ] **Step 3: Implement allowlist-based projection**

Never use a denylist for public fields. Explicitly allow stable ID, public name, public description, use cases, domain, operating class, risk label, public boundaries, public skill/integration IDs, public evaluation summary, and public compatibility state.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/core/reference-policy.test.mjs
git add marketplace/core/reference-policy.mjs tests/marketplace/core/reference-policy.test.mjs
git commit -m "feat(marketplace): separate reference visibility from commerce"
```

---

### Task 8: Add outbox/idempotency acceptance suite and Unit 2 CI

**Files:**
- Create: `tests/marketplace/core/idempotency.test.mjs`
- Create: `.github/workflows/marketplace-core.yml`
- Modify: `README.md`

**Interfaces:**
- CI runs Unit 1 + Unit 2 tests.

- [ ] **Step 1: Test duplicate and out-of-order events**

Process `1.1.0` then a delayed `1.0.1`; assert both historical receipts exist but active candidate remains `1.1.0`.

- [ ] **Step 2: Test publication failure preserves last-known-good**

Seed `1.0.0 PUBLISHED`, project `1.1.0`, fail evaluation, assert `1.0.0` remains `ACTIVE`.

- [ ] **Step 3: Add CI workflow**

```yaml
name: Marketplace Core
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: node --test tests/marketplace/canon/*.test.mjs tests/marketplace/core/*.test.mjs
```

- [ ] **Step 4: Run complete tests**

Run: `node --test tests/*.test.mjs tests/marketplace/canon/*.test.mjs tests/marketplace/core/*.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/marketplace/core/idempotency.test.mjs .github/workflows/marketplace-core.yml README.md
git commit -m "ci(marketplace): gate core projection and publication"
```
