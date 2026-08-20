# Agent Library Marketplace Unit 5 — Publisher Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the private first-party Publisher Studio that turns Canon projections into commercial candidates, evaluations, runtime builds, Offers, and Human Authority publication decisions without allowing marketplace users to directly mutate Canon.

**Architecture:** Publisher Studio is an authenticated application backed by the Unit 4 API and Unit 2 marketplace core. Publisher writes are limited to marketplace/commercial metadata; substantive Role/Skill edits produce Canon-change proposals instead of direct Canon mutations. Publication decisions are append-only records and all sensitive changes produce audit events.

**Tech Stack:** Node.js 22 ESM, `node:test`, PostgreSQL, vanilla HTML/CSS/JS, existing OIDC/app-role authorization.

**Spec:** Frozen marketplace design + review addendum.

## Global Constraints

- Initial publisher is `PUB-001` / Full Stack Assets / `FIRST_PARTY`.
- Publisher Studio does not directly edit Canon.
- New paid activation, price/license changes, major versions, Moderate/High/Restricted risk, I3/I4 changes, sensitive data/authority, uncertain rights/provenance, security-sensitive changes, and third-party publisher activation require Human Authority.
- Trust/evaluation labels are evidence-derived, never manually typed marketing badges.
- Published ProductVersions remain immutable.
- Publisher A may never access Publisher B private drafts/evaluations when third-party support arrives.

---

### Task 1: Add publisher ownership and submission schema

**Files:**
- Create: `marketplace/db/migrations/003_publisher_studio.sql`
- Create: `tests/marketplace/publisher/schema.test.mjs`

**Interfaces:**
- Adds tables: `publisher_memberships`, `commercial_candidates`, `canon_change_proposals`, `publication_reviews`, `runtime_build_jobs`, `publisher_audit_events`.

- [ ] **Step 1: Write failing schema tests**

Assert publisher-scoped tables contain `publisher_id` FKs, publication reviews reference ProductVersion, and `canon_change_proposals` store canonical ref + proposed patch/document + status without changing canonical tables.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/publisher/schema.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Write migration with strict enums**

Candidate states: `NEW`, `NEEDS_EVALUATION`, `NEEDS_RUNTIME_BUILD`, `NEEDS_OFFER`, `READY_FOR_REVIEW`, `BLOCKED`, `PUBLISHED`.
Proposal states: `DRAFT`, `SUBMITTED`, `ACCEPTED_UPSTREAM`, `REJECTED_UPSTREAM`, `WITHDRAWN`.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/publisher/schema.test.mjs
git add marketplace/db/migrations/003_publisher_studio.sql tests/marketplace/publisher/schema.test.mjs
git commit -m "feat(publisher): add publisher workflow schema"
```

---

### Task 2: Generate commercial candidates from projected Canon inventory

**Files:**
- Create: `marketplace/publisher/candidates.mjs`
- Create: `tests/marketplace/publisher/candidates.test.mjs`

**Interfaces:**
- Produces: `candidateFromProductVersion(product, version, evidence)`, `candidateReadiness(candidate)`.

- [ ] **Step 1: Write readiness tests**

```js
assert.deepEqual(candidateReadiness({
  schema_valid:true, provenance_complete:true, evaluation_status:"MISSING",
  offer_status:"MISSING", runtime_build_status:"MISSING",
}), {
  state:"NEEDS_EVALUATION",
  blockers:["EVALUATION_REQUIRED","OFFER_REQUIRED","RUNTIME_BUILD_REQUIRED"],
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/publisher/candidates.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement deterministic blocker ordering**

Order blockers: schema, provenance/rights, evaluation, runtime build, Offer/license, policy review.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/publisher/candidates.test.mjs
git add marketplace/publisher/candidates.mjs tests/marketplace/publisher/candidates.test.mjs
git commit -m "feat(publisher): derive commercial candidate readiness"
```

---

### Task 3: Implement evaluation record ingestion and trust-level derivation

**Files:**
- Create: `marketplace/publisher/evaluations.mjs`
- Create: `tests/marketplace/publisher/evaluations.test.mjs`

**Interfaces:**
- Produces: `validateEvaluationRecord(record)`, `deriveTrustState(records, runtimeDistributions) -> SPECIFIED | TESTED | VERIFIED | PILOTED | PRODUCTION_PROVEN`.

- [ ] **Step 1: Write trust-state tests**

`VERIFIED` must require passed representative fixtures, no unresolved critical failure, provenance complete, and at least one verified runtime package. `PRODUCTION_PROVEN` additionally requires an observation window and monitored production evidence.

- [ ] **Step 2: Add false-badge test**

A manually supplied `trust_state:"PRODUCTION_PROVEN"` in product metadata must be ignored; derived evidence controls output.

- [ ] **Step 3: Implement validator/deriver and commit**

```bash
node --test tests/marketplace/publisher/evaluations.test.mjs
git add marketplace/publisher/evaluations.mjs tests/marketplace/publisher/evaluations.test.mjs
git commit -m "feat(publisher): derive evidence-backed trust state"
```

---

### Task 4: Add universal/runtime build job contract

**Files:**
- Create: `marketplace/distribution/manifest.mjs`
- Create: `marketplace/distribution/build-jobs.mjs`
- Create: `tests/marketplace/distribution/build-jobs.test.mjs`

**Interfaces:**
- Produces universal manifest fields: product/product-version IDs, canonical refs/hashes, license ref, components, runtime adapters, evaluation refs, provenance receipt.
- `enqueueRuntimeBuild(repo, productVersionId, runtime)`.

- [ ] **Step 1: Write manifest completeness test**

```js
const manifest = createUniversalManifest(fixture);
for (const key of ["product_id","product_version_id","canonical_refs","canonical_hashes","components","license_ref","provenance_receipt_id"]) {
  assert.ok(manifest[key], key);
}
```

- [ ] **Step 2: Write unsupported-runtime test**

Unknown runtime must return `UNAVAILABLE`, not fabricate an adapter.

- [ ] **Step 3: Implement build-job idempotency**

Unique key `(product_version_id,runtime,adapter_version)`; repeated enqueue returns existing job.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/distribution/build-jobs.test.mjs
git add marketplace/distribution tests/marketplace/distribution/build-jobs.test.mjs
git commit -m "feat(publisher): define runtime distribution builds"
```

---

### Task 5: Implement Offer and LicensePolicy authoring rules

**Files:**
- Create: `marketplace/publisher/offers.mjs`
- Create: `tests/marketplace/publisher/offers.test.mjs`

**Interfaces:**
- Produces: `validateOffer(offer)`, `offerChangeRequiresHuman(previous,next)`.

- [ ] **Step 1: Write price/license tests**

Require integer minor units, uppercase ISO currency for paid offers, explicit license policy, and no negative amount. `FREE` must have amount `0` and no payment-provider price ID requirement.

- [ ] **Step 2: Write Human Authority tests**

Any activation from no paid Offer to paid Offer, price change, license class change, redistribution-right change, or enterprise-only restriction returns `true` for `offerChangeRequiresHuman`.

- [ ] **Step 3: Implement and commit**

```bash
node --test tests/marketplace/publisher/offers.test.mjs
git add marketplace/publisher/offers.mjs tests/marketplace/publisher/offers.test.mjs
git commit -m "feat(publisher): validate offers and license changes"
```

---

### Task 6: Implement publication review packets and approval execution

**Files:**
- Create: `marketplace/publisher/review-packet.mjs`
- Create: `marketplace/publisher/publication-service.mjs`
- Create: `tests/marketplace/publisher/publication-service.test.mjs`

**Interfaces:**
- Produces: `buildReviewPacket(context)`, `approvePublication(repo, {reviewId, reviewer, expectedVersionHash})`.

- [ ] **Step 1: Write payload-binding test**

Approval for hash `abc` must fail if the candidate changes to hash `def` before approval is executed.

- [ ] **Step 2: Write separation-of-duties test**

An automated evaluation worker may create the review packet but may not act as `reviewer` for a Human Authority-required decision.

- [ ] **Step 3: Implement review packet fields**

Include product/version, canonical refs/hashes, change severity, risk, new permissions/data classes, evaluation summary, rights/provenance, runtime status, Offer/license diff, blockers, requested action.

- [ ] **Step 4: Implement append-only PublicationRecord creation**

Approval transaction inserts PublicationRecord + outbox event and changes mutable availability pointer; it does not alter ProductVersion content.

- [ ] **Step 5: Run tests and commit**

```bash
node --test tests/marketplace/publisher/publication-service.test.mjs
git add marketplace/publisher tests/marketplace/publisher/publication-service.test.mjs
git commit -m "feat(publisher): bind human publication approvals to version evidence"
```

---

### Task 7: Add Publisher API endpoints and publisher isolation

**Files:**
- Modify: `apps/marketplace-api/src/router.mjs`
- Create: `apps/marketplace-api/src/services/publisher.mjs`
- Create: `tests/marketplace/api/publisher.test.mjs`

**Interfaces:**
- `GET /v1/publisher/canon`
- `GET /v1/publisher/candidates`
- `GET /v1/publisher/products/:id`
- `POST /v1/publisher/products/:id/offers`
- `POST /v1/publisher/products/:id/evaluations`
- `POST /v1/publisher/products/:id/runtime-builds`
- `POST /v1/publisher/products/:id/publication-review`
- `POST /v1/publisher/reviews/:id/approve`
- `POST /v1/publisher/canon-proposals`

- [ ] **Step 1: Write first-party role tests**

`PUBLISHER_MEMBER` may view PUB-001 candidates but may not approve Human Authority reviews unless it also carries `REVIEWER` and satisfies the configured named-approver rule.

- [ ] **Step 2: Write publisher-boundary test**

Fixture PUB-002; PUB-001 member requesting PUB-002 draft gets 403 and no existence-leaking detail beyond `FORBIDDEN`.

- [ ] **Step 3: Implement scoped queries and audit writes**

Every mutation writes `publisher_audit_events` with actor, object, action, before/after hash, result, correlation ID.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/api/publisher.test.mjs
git add apps/marketplace-api/src/router.mjs apps/marketplace-api/src/services/publisher.mjs tests/marketplace/api/publisher.test.mjs
git commit -m "feat(marketplace-api): expose governed publisher workflows"
```

---

### Task 8: Build the Publisher Studio UI

**Files:**
- Create: `publisher/index.html`
- Create: `publisher/canon/index.html`
- Create: `publisher/candidates/index.html`
- Create: `publisher/products/index.html`
- Create: `publisher/evaluations/index.html`
- Create: `publisher/releases/index.html`
- Create: `publisher/runtime-builds/index.html`
- Create: `publisher/offers/index.html`
- Create: `publisher/analytics/index.html`
- Create: `assets/publisher-studio.js`
- Modify: `assets/style.css`
- Create: `tests/marketplace/publisher/ui.test.mjs`

**Interfaces:**
- Static authenticated shell calling Publisher API.

- [ ] **Step 1: Write route and state tests**

Assert all Studio routes exist and candidate page exposes machine states/blockers: `NEEDS_EVALUATION`, `NEEDS_RUNTIME_BUILD`, `NEEDS_OFFER`, `READY_FOR_REVIEW`, `BLOCKED`.

- [ ] **Step 2: Implement Canon Inventory view**

Display stable ID, canonical status, marketplace state, commercial state, trust state, runtime build summary, and blockers. A substantive-edit action must say `Propose Canon change`, never `Edit Canon`.

- [ ] **Step 3: Implement candidate detail actions**

Buttons: `Run evaluation`, `Build runtime package`, `Configure offer`, `Preview listing`, `Request publication`. Only show `Approve publication` for API-confirmed reviewer authority.

- [ ] **Step 4: Run link/UI tests and commit**

```bash
node --test tests/site-links.test.mjs tests/marketplace/publisher/ui.test.mjs
git add publisher assets/publisher-studio.js assets/style.css tests/marketplace/publisher/ui.test.mjs
git commit -m "feat(publisher): add first-party publisher studio"
```

---

### Task 9: Add Unit 5 acceptance suite

**Files:**
- Create: `tests/marketplace/publisher/publish-flow.acceptance.test.mjs`
- Create: `.github/workflows/marketplace-publisher.yml`
- Modify: `README.md`

**Interfaces:**
- End-to-end: reference ProductVersion -> candidate -> evaluation -> runtime build -> Offer -> Human review -> PublicationRecord -> catalog event.

- [ ] **Step 1: Test low-risk free auto path**

Eligible free/low-risk fixture reaches `PUBLISHED` automatically after complete evidence.

- [ ] **Step 2: Test paid/high-risk gated path**

Paid/high-risk fixture must stop at `PUBLICATION_REVIEW`; attempted automated approval fails; named review succeeds only against unchanged version hash.

- [ ] **Step 3: Test Canon-change proposal boundary**

Publisher proposes a Role boundary change; verify marketplace stores proposal only and does not alter canonical snapshot.

- [ ] **Step 4: Run full Unit 5 suite**

Run all prior suites plus `tests/marketplace/publisher/*.test.mjs` and `tests/marketplace/api/publisher.test.mjs`.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/marketplace/publisher .github/workflows/marketplace-publisher.yml README.md
git commit -m "ci(publisher): gate commercial publication workflow"
```
