# Agent Library Marketplace Unit 6 — Commerce & Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first real payment adapter, subscription/refund/revocation semantics, production-grade artifact/security controls, backup/recovery, monitoring, and release gates required before paid launch.

**Architecture:** Commerce is an adapter layer feeding the Entitlement Engine. Stripe is the first supported payment adapter, but payment events never directly authorize downloads. Production hardening adds package scanning, immutable artifact receipts, last-known-good catalog recovery, audit/metrics, and a ten-gate launch checklist enforced in CI and release tooling.

**Tech Stack:** Node.js 22 ESM, `node:test`, PostgreSQL, Stripe SDK as first payment adapter, provider-neutral artifact/storage interfaces, GitHub Actions, existing GitHub Pages deployment for public static site.

**Spec:** Frozen marketplace design + review addendum.

## Global Constraints

- Payment success is evidence, not entitlement authority.
- Webhook/event processing is idempotent and signature-verified.
- Refund/revocation behavior is explicit and auditable.
- No production secret is committed to the repository.
- Security scan failure blocks affected package publication/download according to severity.
- Public catalog retains last-known-good deployment on API/build failure.
- Paid launch cannot occur until all ten marketplace release gates pass.
- No merge/deploy is part of this plan unless separately authorized at execution time.

---

### Task 1: Add payment-adapter contract and Stripe implementation

**Files:**
- Create: `apps/marketplace-api/src/payments/adapter.mjs`
- Create: `apps/marketplace-api/src/payments/stripe.mjs`
- Create: `apps/marketplace-api/src/services/checkout.mjs`
- Create: `tests/marketplace/commerce/stripe-adapter.test.mjs`
- Modify: `apps/marketplace-api/package.json`
- Modify: `apps/marketplace-api/package-lock.json`

**Interfaces:**
- `PaymentAdapter.createCheckout({offer, subject, successUrl, cancelUrl})`
- `PaymentAdapter.verifyEvent({rawBody, signature})`
- `PaymentAdapter.normalizeEvent(providerEvent) -> {provider_event_id,type,provider_customer_id,provider_subscription_id,offer_ref,subject_ref,amount,currency,occurred_at}`

- [ ] **Step 1: Add exact Stripe dependency**

```bash
cd apps/marketplace-api
npm install --save-exact stripe
```

Commit the resulting exact lockfile.

- [ ] **Step 2: Write failing signature/normalization tests**

Use Stripe test webhook signing helpers or a deterministic fixture secret. Assert invalid signatures fail before JSON processing and normalized events never expose raw card/payment method data.

- [ ] **Step 3: Implement Stripe adapter behind generic interface**

Read `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` from environment only. Reject startup in commerce-enabled mode when either is missing.

- [ ] **Step 4: Implement checkout service**

Checkout consumes an approved active Offer and authenticated subject. Never trust price/amount supplied by browser request.

- [ ] **Step 5: Run tests and commit**

```bash
node --test tests/marketplace/commerce/stripe-adapter.test.mjs
git add apps/marketplace-api/src/payments apps/marketplace-api/src/services/checkout.mjs apps/marketplace-api/package*.json tests/marketplace/commerce/stripe-adapter.test.mjs
git commit -m "feat(commerce): add stripe payment adapter"
```

---

### Task 2: Add payment event ledger and idempotent entitlement fulfillment

**Files:**
- Create: `marketplace/db/migrations/004_commerce.sql`
- Create: `apps/marketplace-api/src/services/payment-events.mjs`
- Modify: `apps/marketplace-api/src/router.mjs`
- Create: `tests/marketplace/commerce/fulfillment.test.mjs`

**Interfaces:**
- Tables: `payment_events`, `commerce_receipts`.
- Route: `POST /v1/payments/stripe/webhook` using raw request body.
- Produces entitlement mutations through Unit 4 entitlement repository only after verified normalized events.

- [ ] **Step 1: Write duplicate webhook test**

Process the same provider event ID twice; assert one `payment_events` row and one entitlement fulfillment receipt.

- [ ] **Step 2: Write spoofed browser payload test**

A direct client POST claiming `checkout.session.completed` without valid Stripe signature must return 400 and create no event/entitlement.

- [ ] **Step 3: Implement transactional fulfillment**

Transaction: insert unique provider event -> validate Offer mapping/subject -> create/update Purchase or Subscription -> create/update Entitlement -> insert commerce receipt -> append audit/outbox event.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/commerce/fulfillment.test.mjs
git add marketplace/db/migrations/004_commerce.sql apps/marketplace-api/src/services/payment-events.mjs apps/marketplace-api/src/router.mjs tests/marketplace/commerce/fulfillment.test.mjs
git commit -m "feat(commerce): fulfill verified payments idempotently"
```

---

### Task 3: Implement subscription, cancellation, refund, and revocation semantics

**Files:**
- Create: `marketplace/commerce/lifecycle.mjs`
- Create: `tests/marketplace/commerce/lifecycle.test.mjs`

**Interfaces:**
- Produces: `applyCommerceEvent(currentState,event) -> {purchase,subscription,entitlement,actions}`.

- [ ] **Step 1: Write lifecycle matrix tests**

Cover: active subscription renewal, payment failure grace behavior from configured policy, cancellation at period end, immediate administrative revoke, full refund on perpetual purchase, partial refund with no automatic revoke unless Offer policy says so.

- [ ] **Step 2: Implement policy-driven transitions**

Do not hard-code business outcomes into Stripe event names. Map normalized event + LicensePolicy into entitlement actions.

- [ ] **Step 3: Add audit reason requirements**

Administrative revoke requires nonempty `reason_code` and actor. Customer cancellation records actor as authenticated subject.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/commerce/lifecycle.test.mjs
git add marketplace/commerce/lifecycle.mjs tests/marketplace/commerce/lifecycle.test.mjs
git commit -m "feat(commerce): govern entitlement lifecycle"
```

---

### Task 4: Add package integrity/security scanner

**Files:**
- Create: `marketplace/security/scan-package.mjs`
- Create: `marketplace/security/rules.mjs`
- Create: `tests/fixtures/packages/safe-package/manifest.json`
- Create: `tests/fixtures/packages/unsafe-secret-package/manifest.json`
- Create: `tests/marketplace/security/package-scan.test.mjs`

**Interfaces:**
- Produces: `scanPackage(directory) -> {status:'PASS'|'BLOCK', findings:[{rule,severity,path,message}]}`.

- [ ] **Step 1: Write secret/path/executable tests**

Block private-key patterns, likely API tokens in text, absolute/path-traversal archive paths, symlinks escaping package root, unexpected executable binaries, undeclared external endpoints, and manifest permission scopes exceeding canonical declarations.

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/marketplace/security/package-scan.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement deterministic scanner**

Use built-in filesystem traversal, size caps, extension/permission allowlists, and regex detectors. Do not log raw secret candidates; findings include path + rule only.

- [ ] **Step 4: Add publication integration test**

A `BLOCK` result sets RuntimeDistribution to `BLOCKED` and prevents publication if that distribution is required.

- [ ] **Step 5: Run tests and commit**

```bash
node --test tests/marketplace/security/package-scan.test.mjs
git add marketplace/security tests/fixtures/packages tests/marketplace/security/package-scan.test.mjs
git commit -m "feat(security): scan marketplace distribution packages"
```

---

### Task 5: Add S3-compatible production artifact adapter and immutable receipts

**Files:**
- Create: `apps/marketplace-api/src/artifacts/s3-store.mjs`
- Create: `marketplace/artifacts/receipt.mjs`
- Create: `tests/marketplace/security/artifact-receipt.test.mjs`

**Interfaces:**
- Environment: `ARTIFACT_S3_ENDPOINT`, `ARTIFACT_S3_REGION`, `ARTIFACT_S3_BUCKET`, `ARTIFACT_S3_ACCESS_KEY_ID`, `ARTIFACT_S3_SECRET_ACCESS_KEY`.
- Produces: `createArtifactReceipt({bytes,productVersionId,runtime,buildId,provenanceReceiptId})`.

- [ ] **Step 1: Write receipt determinism tests**

Same bytes/metadata produce same SHA-256 content identity; mutated bytes fail verification.

- [ ] **Step 2: Implement adapter interface without vendor-specific business logic**

S3 adapter handles object put/head/signed read grant only. Entitlement logic remains in services.

- [ ] **Step 3: Require immutable object keys**

Key format: `products/<productId>/<version>/<runtime>/<sha256>/<filename>`; never overwrite an existing hash key.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/security/artifact-receipt.test.mjs
git add apps/marketplace-api/src/artifacts/s3-store.mjs marketplace/artifacts tests/marketplace/security/artifact-receipt.test.mjs
git commit -m "feat(artifacts): add immutable s3-compatible storage adapter"
```

---

### Task 6: Implement backup/restore and last-known-good catalog controls

**Files:**
- Create: `marketplace/operations/backup-manifest.mjs`
- Create: `marketplace/operations/catalog-release.mjs`
- Create: `marketplace/bin/verify-backup.mjs`
- Create: `tests/marketplace/operations/recovery.test.mjs`

**Interfaces:**
- Backup manifest includes canonical snapshot hash, DB backup reference/hash, artifact inventory root hash, catalog snapshot hash, audit high-water mark, timestamp.
- `promoteCatalog(candidateDir, liveDir, manifest)` only after validation.

- [ ] **Step 1: Write failed-catalog-promotion test**

Seed live catalog, provide candidate with broken manifest/hash, assert live catalog byte tree remains unchanged.

- [ ] **Step 2: Write recovery-order test**

Verify recovery verifier checks Canon receipt first, then marketplace DB, artifact inventory, customer entitlements, then generated catalog.

- [ ] **Step 3: Implement manifest verification and atomic promotion**

No in-place catalog mutation. Candidate directory is validated and renamed/symlinked/promoted only after checks pass.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/operations/recovery.test.mjs
git add marketplace/operations marketplace/bin/verify-backup.mjs tests/marketplace/operations/recovery.test.mjs
git commit -m "feat(operations): add marketplace recovery controls"
```

---

### Task 7: Add health, audit, and operational metrics

**Files:**
- Create: `apps/marketplace-api/src/observability/metrics.mjs`
- Create: `apps/marketplace-api/src/observability/audit.mjs`
- Modify: `apps/marketplace-api/src/router.mjs`
- Create: `tests/marketplace/operations/metrics.test.mjs`

**Interfaces:**
- `GET /health` returns process health only.
- `GET /ready` checks required DB/config/adapters without exposing secrets.
- Metrics counters: canon events received, projection successes/failures, publication queue age, auto/human publish counts, runtime build failures, entitlement errors, payment-event failures, catalog build failures, rollbacks.

- [ ] **Step 1: Write no-sensitive-data audit test**

Audit event must contain actor ID/ref, action, object ref, result, correlation ID, before/after hashes where relevant, but not access tokens, card data, artifact payload, raw sensitive Canon content.

- [ ] **Step 2: Implement in-process metric registry with adapter interface**

Core code emits metric names/labels to injected sink; default sink may log structured counters for initial deployment. Do not couple domain logic to a monitoring vendor.

- [ ] **Step 3: Implement readiness checks**

Return 503 if required DB unavailable or commerce enabled with missing Stripe config; public GitHub Pages site is unaffected.

- [ ] **Step 4: Run tests and commit**

```bash
node --test tests/marketplace/operations/metrics.test.mjs
git add apps/marketplace-api/src/observability apps/marketplace-api/src/router.mjs tests/marketplace/operations/metrics.test.mjs
git commit -m "feat(operations): add marketplace audit and health telemetry"
```

---

### Task 8: Add the ten-gate production launch verifier

**Files:**
- Create: `marketplace/release/gates.mjs`
- Create: `marketplace/bin/verify-marketplace-release.mjs`
- Create: `tests/marketplace/release/gates.test.mjs`

**Interfaces:**
- Required gates: `REGISTRY_INTEGRITY`, `PUBLICATION_RULES`, `ENTITLEMENT_ISOLATION`, `PAYMENT_RECONCILIATION`, `ARTIFACT_AUTHORIZATION`, `AUDIT_LOGGING`, `ROLLBACK`, `SECURITY_SCAN`, `ACCESSIBILITY`, `STATIC_CATALOG_FALLBACK`.

- [ ] **Step 1: Write all-gates-required test**

```js
const result = verifyRelease(Object.fromEntries(REQUIRED_GATES.map((g) => [g,"PASS"])));
assert.equal(result.status, "PASS");
assert.throws(() => verifyRelease({REGISTRY_INTEGRITY:"PASS"}), /missing gate/i);
```

- [ ] **Step 2: Implement verifier**

Any `FAIL`, `BLOCKED`, `UNKNOWN`, or missing gate returns nonzero CLI exit. Store evidence refs for each gate in generated release receipt.

- [ ] **Step 3: Run tests and commit**

```bash
node --test tests/marketplace/release/gates.test.mjs
git add marketplace/release marketplace/bin/verify-marketplace-release.mjs tests/marketplace/release/gates.test.mjs
git commit -m "feat(release): enforce marketplace production gates"
```

---

### Task 9: Add CI security/release workflow without auto-deployment

**Files:**
- Create: `.github/workflows/marketplace-release.yml`
- Modify: `.github/workflows/jekyll-gh-pages.yml`
- Create: `docs/runbooks/marketplace-release.md`

**Interfaces:**
- PRs: run all tests/security scan/release verifier with non-production fixtures.
- `main`: Pages workflow may continue static deployment only after library generation/tests; API production deployment is not added by this plan.

- [ ] **Step 1: Add release workflow**

Set permissions to `contents: read`; no production environment write permissions. Run Node 22 tests, package scan fixtures, and release-gate verifier.

- [ ] **Step 2: Document deployment boundary**

Runbook states public Pages deployment and API/artifact/database deployment are separate. API production deployment requires a separately approved provider adapter and credentials.

- [ ] **Step 3: Run local/CI-equivalent suite**

Run all repository Node tests plus `node marketplace/bin/verify-marketplace-release.mjs --fixture tests/fixtures/release/pass.json`.
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/marketplace-release.yml .github/workflows/jekyll-gh-pages.yml docs/runbooks/marketplace-release.md
git commit -m "ci(marketplace): add security and release verification"
```

---

### Task 10: Prove paid end-to-end acceptance without production side effects

**Files:**
- Create: `tests/marketplace/commerce/paid-flow.acceptance.test.mjs`
- Create: `tests/fixtures/release/pass.json`
- Modify: `README.md`

**Interfaces:**
- End-to-end fixture uses fake/Stripe test-mode normalized event, in-memory or test DB repository, filesystem artifact store, and no external production write.

- [ ] **Step 1: Build accepted paid product fixture**

Create approved ProductVersion + active Offer + PERPETUAL_COMMERCIAL LicensePolicy + verified universal RuntimeDistribution + artifact receipt.

- [ ] **Step 2: Process verified test payment event**

Assert Purchase + Entitlement + audit receipt are created once.

- [ ] **Step 3: Request download as entitled user**

Assert artifact grant succeeds and SHA-256 matches receipt.

- [ ] **Step 4: Refund/revoke and retry**

Apply policy-defined full refund/revoke and assert future grant is denied while historical Purchase/Publication records remain traceable.

- [ ] **Step 5: Run full marketplace suite**

Run every prior unit test plus paid acceptance test. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/marketplace/commerce/paid-flow.acceptance.test.mjs tests/fixtures/release/pass.json README.md
git commit -m "test(commerce): prove governed paid marketplace flow"
```
