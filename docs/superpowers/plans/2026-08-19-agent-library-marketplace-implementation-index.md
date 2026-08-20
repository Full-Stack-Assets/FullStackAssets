# Agentic Capability Library & Marketplace — Implementation Plan Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Canon-backed Agent/Skill Library and commercial marketplace in six serial, independently verifiable units.

**Architecture:** The public Full Stack Assets site remains statically deployable through GitHub Pages. Canon stays authoritative and external to marketplace ownership. Node 22 ESM domain/generator code projects Canon into marketplace records and static pages; PostgreSQL, OIDC, artifact storage, Publisher Studio, and commerce are added only after the static registry pipeline is proven.

**Tech Stack:** Node.js 22 ESM, `node:test`, vanilla HTML/CSS/JS, PostgreSQL behind repository adapters, OIDC/JWT via `jose`, S3-compatible artifact storage behind an adapter, Stripe as the first payment adapter, GitHub Actions, GitHub Pages for the public static site.

**Spec:** `docs/superpowers/specs/2026-08-19-agentic-capability-library-marketplace-design.md` and `docs/superpowers/specs/2026-08-19-agentic-capability-library-marketplace-design-review-addendum.md`

## Global Constraints

- Canon defines capabilities; marketplace projects/packages/commercializes them.
- No marketplace component may directly grant or change canonical Role/Skill authority.
- Published ProductVersions are immutable; availability is separately mutable/audited.
- `REFERENCE_ONLY` public discovery is separate from `FREE`/`PAID` commercial distribution.
- Runtime compatibility is evidence-backed and runtime-specific.
- Entitlements govern commercial access; payment adapters do not.
- I4/consequential actions remain Human Authority even after purchase/install.
- Existing static-site tests and GitHub Pages deployment remain green throughout.
- No production merge/deploy is implied by implementation-plan execution.

---

## Serial execution order

1. **Unit 1 — Canon Registry Adapter**  
   `2026-08-19-agent-library-marketplace-unit-1-canon-adapter.md`

2. **Unit 2 — Marketplace Core**  
   `2026-08-19-agent-library-marketplace-unit-2-marketplace-core.md`

3. **Unit 3 — Public Library**  
   `2026-08-19-agent-library-marketplace-unit-3-public-library.md`

4. **Unit 4 — Customer Library**  
   `2026-08-19-agent-library-marketplace-unit-4-customer-library.md`

5. **Unit 5 — Publisher Studio**  
   `2026-08-19-agent-library-marketplace-unit-5-publisher-studio.md`

6. **Unit 6 — Commerce & Production Hardening**  
   `2026-08-19-agent-library-marketplace-unit-6-commerce-hardening.md`

Do not start Unit N+1 until Unit N acceptance tests pass and its interfaces are reviewed.

---

## Cross-unit interface contract

### Unit 1 produces

```text
data/library/canon.snapshot.json
data/library/canon.relationships.json
data/library/canon.checksums.json
data/library/canon.events.jsonl
```

Domain interfaces:

```js
loadCanonExport(dir)
normalizeExport(raw)
buildSnapshot(exportData)
diffSnapshots(previous, next)
validateRelationships(snapshot)
```

Unit 2 consumes these artifacts/functions; it never re-parses Canon independently.

### Unit 2 produces

Core entities:

```text
Publisher
Product
ProductVersion
ProductComponent
RuntimeDistribution
EvaluationRecord
PublicationRecord
Offer
LicensePolicy
OutboxEvent
ProjectionReceipt
```

Core interfaces:

```js
projectCanonEvent(repo, event, canonicalEntity)
classifyCanonicalChange(previousEntity, nextEntity)
publicationDecision(context)
referenceVisibilityDecision(entity)
transitionVersion(current, event)
```

Unit 3 consumes only public/read-model projections from Unit 2. Units 4–6 consume the same core record semantics and repository contract.

### Unit 3 produces

```text
data/library/catalog.snapshot.json
data/library/search-index.json
library/** static routes
assets/library.js
```

Interfaces:

```js
buildPublicCatalog(readModel)
buildSearchIndex(catalog)
searchIndex(index, query, filters)
renderEntry(entry)
```

Public browsing remains available without Units 4–6.

### Unit 4 produces

Customer persistence/API contract:

```text
User
Organization
Membership
Purchase
Subscription
Entitlement
Installation
Collection
CollectionItem
UpdatePreference
```

Interfaces:

```js
resolveEntitlement(context)
computeUpdateState(context)
ArtifactStore.getMetadata(id)
ArtifactStore.createReadGrant(id, context)
```

Unit 5 reuses authentication/app-role handling. Unit 6 is the only unit allowed to fulfill entitlements from verified payment events.

### Unit 5 produces

Publisher workflow:

```text
CommercialCandidate
CanonChangeProposal
PublicationReview
RuntimeBuildJob
PublisherAuditEvent
```

Interfaces:

```js
candidateReadiness(candidate)
deriveTrustState(records, distributions)
validateOffer(offer)
offerChangeRequiresHuman(previous, next)
buildReviewPacket(context)
approvePublication(repo, approval)
```

Unit 6 may create payments for active approved Offers but may not bypass publication status.

### Unit 6 produces

Commerce/operations interfaces:

```js
PaymentAdapter.createCheckout(context)
PaymentAdapter.verifyEvent(input)
PaymentAdapter.normalizeEvent(providerEvent)
applyCommerceEvent(currentState, event)
scanPackage(directory)
createArtifactReceipt(context)
verifyRelease(gates)
```

---

## Test execution contract

Use explicit directory lists instead of relying on Bash `globstar` behavior:

```bash
node --test \
  tests/*.test.mjs \
  tests/marketplace/canon/*.test.mjs \
  tests/marketplace/core/*.test.mjs \
  tests/marketplace/catalog/*.test.mjs \
  tests/marketplace/api/*.test.mjs \
  tests/marketplace/customer/*.test.mjs \
  tests/marketplace/publisher/*.test.mjs \
  tests/marketplace/distribution/*.test.mjs \
  tests/marketplace/commerce/*.test.mjs \
  tests/marketplace/security/*.test.mjs \
  tests/marketplace/operations/*.test.mjs \
  tests/marketplace/release/*.test.mjs
```

During early units, omit directories that do not yet exist.

Existing tests remain mandatory:

```bash
node --test tests/site-content.test.mjs tests/site-links.test.mjs
```

---

## Definition-of-Done ladder

### After Unit 1

A canonical export deterministically produces validated stable-ID snapshot/relationship/checksum/event artifacts and fails closed without overwriting last-known-good output.

### After Unit 2

New/changed canonical entities automatically create idempotent marketplace reference/ProductVersion projections; reference-only vs commercial state is distinct; publication policy and immutable-version rules are proven.

### After Unit 3

Adding `SKL-046` only to Canon input causes a new searchable `/library/skills/.../` volume to appear without a manually authored storefront record. Public pages survive backend absence.

### After Unit 4

Authenticated customers can see only their own/user-org entitlements, download only authorized immutable artifacts, create collections, pin versions, and see truthful update/runtime states.

### After Unit 5

First-party Publisher Studio can commercialize projected Canon items, run evidence/evaluation/runtime build workflows, configure Offers, create bound review packets, and publish only through the approved tiered gate. Canon changes remain proposals upstream.

### After Unit 6

A verified test-mode paid transaction creates exactly one entitlement, authorizes an immutable artifact download, handles refund/revoke according to LicensePolicy, passes package/security/recovery tests, and the ten release gates all have evidence.

---

## Self-review results

- **Spec coverage:** all approved Sections 1–8 map to one or more Unit tasks. Public reference projection is covered in Units 2–3; immutable events/versions in Units 1–2; customer entitlements in Unit 4; Publisher Studio/publication gates in Unit 5; payment/security/recovery/release in Unit 6.
- **Authority consistency:** no unit grants marketplace authority upstream into Canon. No payment/install path grants I4 Agent authority.
- **Identity consistency:** canonical stable IDs remain canonical identity; marketplace Product IDs are separate commercial identities.
- **Public/commercial consistency:** `REFERENCE_ONLY` is explicit and no Offer/entitlement is implied.
- **Runtime consistency:** universal package is primary; runtime distributions remain evidence-backed adapters.
- **Deployment consistency:** GitHub Pages remains the public static deployment. API production deployment remains a separate operational decision and is not silently introduced into the Pages workflow.
- **Existing-site consistency:** Unit 3 preserves person-first homepage tests and local-link checks.
- **No-placeholder scan:** the plans intentionally avoid `TBD`, `TODO`, generic “handle errors,” or unbound future function names. Provider deployment selection is outside implementation semantics and remains an adapter/configuration decision rather than an unfinished code requirement.

---

## Recommended execution method

Execute **one Unit at a time**, with fresh task context and review at every task boundary. Unit 1 is the correct first execution target because every later feature depends on stable, deterministic Canon projection and duplicate prevention.
