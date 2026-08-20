# Agentic Capability Library & Marketplace — Canonical Design Specification

**Status:** FROZEN DESIGN — APPROVED THROUGH SECTION 8  
**Date:** 2026-08-19  
**Repository surface:** `Full-Stack-Assets/FullStackAssets`  
**Primary public route:** `/library/`  
**Authority:** Human Authority → AOC Canon → BuildGraph Core → Agentic Skill OS → Marketplace Projection → Runtime Distributions

## 1. Purpose and product decisions

Build a persistent, monetizable, provider-neutral marketplace/library backed by the canonical Agentic AI Role Library so approved new or changed Skills, Roles, Workflows, Integrations, and Collections propagate into the Library without manual duplicate entry.

Approved product decisions:

- Hybrid model: public discovery/storefront + authenticated customer Library + private Publisher Studio.
- Tiered publication: low-risk/free eligible items may auto-publish after validation; paid, material, major-version, high-risk, licensing, and consequential-authority changes require Human Authority.
- Curated ecosystem: first-party at launch, with `Publisher` first-class from day one for later verified third-party publishing.
- Multi-product marketplace: Skills, Agents, Workflow Packs, and Collections are independently licensable.
- Mixed licensing: Free, one-time/perpetual, subscription, team, enterprise, and custom.
- Universal distribution: provider-neutral canonical package first, then runtime-specific distributions where supported.
- Immutable versions: Canon changes create new marketplace `ProductVersion` records rather than mutating published products.
- Canon-backed registry mirror: Canon remains authoritative; marketplace storage is a projection optimized for browsing, commerce, entitlements, installs, analytics, and search.

## 2. Constitutional system boundary

### Authority chain

```text
Human Authority
    ↓
AOC Canon
    ↓
BuildGraph Core
    ↓
Agentic Skill OS
    ↓
Capability / Role / Skill / Integration registries
    ↓
Marketplace Projection
    ↓
Runtime Adapters
    ↓
Temporary AgentInstances / customer installations
```

### Invariants

1. Canon defines capabilities, roles, skills, integration contracts, policies, workflows, evidence, and authority boundaries.
2. Marketplace packages, prices, publishes, distributes, licenses, and measures canonical capabilities.
3. Runtime adapters translate syntax/tooling and may never elevate authority above Canon.
4. Marketplace administration or commercial licensing cannot grant an Agent authority its canonical Role/Integration contract prohibits.
5. Purchased software never implies organizational approval.
6. Published ProductVersions are immutable.
7. Previous published versions remain historically traceable after supersession, suspension, or retirement.
8. Customer entitlements are authoritative for commercial access; payment providers are adapters only.
9. Evidence determines claims such as Verified, Compatible, Production Proven, or Installed.
10. Human Authority remains required for consequential external, legal, financial, clinical, safety, privacy, employment, access-control, or irreversible actions.

### Repository boundary

`Full-Stack-Assets/FullStackAssets` owns the marketplace product surface: public storefront, generated Library pages, customer Library UI, Publisher Studio UI, public docs, marketplace schemas, and marketplace projection code. It does **not** become AOC Canon.

## 3. Product surfaces

### Public Library

Routes:

```text
/library/
/library/agents/
/library/skills/
/library/packs/
/library/collections/
/library/industries/
/library/publishers/
/library/new/
```

Public functionality:

- shelf-style browsing
- search and filters
- stable canonical IDs
- product detail pages
- capability/dependency graphs
- runtime compatibility matrices
- evaluation summaries
- version history
- publisher identity
- pricing/offers
- public docs
- SEO metadata and sitemap entries

Visual metaphor:

- Agent = volume
- Skill = field manual
- Workflow Pack = boxed set
- Collection = shelf
- Overlay = edition sleeve
- Integration = reference/connector card

The metaphor is presentation only. Stable IDs remain the identity system.

### Customer Library

Routes:

```text
/my-library/
/my-library/owned/
/my-library/installed/
/my-library/collections/
/my-library/updates/
/my-library/licenses/
```

Customer functionality includes authentication, acquired products, entitlement resolution, authorized downloads, runtime installs, update availability, version pinning, private Collections, license visibility, and organization membership.

### Publisher Studio

Routes:

```text
/publisher/
/publisher/canon/
/publisher/candidates/
/publisher/products/
/publisher/evaluations/
/publisher/releases/
/publisher/runtime-builds/
/publisher/offers/
/publisher/analytics/
```

Publisher Studio inspects Canon inventory and commercial candidates, configures marketplace metadata/offers, runs evaluations, generates distributions, previews listings, requests publication, reviews blocked states, and inspects publication history/analytics. Substantive Skill/Role edits must route through a Canon change workflow.

## 4. Canon plane and event contract

Canonical entities include Capability, Skill, Role, AgentDefinition, Workflow, Factory, Integration, Overlay, Policy, EvidenceReceipt, and RuntimeAdapter metadata.

Each canonical entity exposes a stable ID, version, status, source/provenance reference, content hash, relationships, and risk/authority metadata where applicable.

Meaningful canonical changes emit append-only events:

```text
CANON_CREATED
CANON_UPDATED
CANON_PROMOTED
CANON_DEPRECATED
CANON_RETIRED
ROLE_SKILL_RELATION_CHANGED
INTEGRATION_REQUIREMENT_CHANGED
POLICY_CHANGED
EVALUATION_COMPLETED
RIGHTS_STATUS_CHANGED
RUNTIME_COMPATIBILITY_CHANGED
```

Canonical event envelope:

```yaml
event:
  id: EVT-...
  entity_type: skill | role | workflow | integration | overlay | policy
  entity_id: ""
  operation: created | updated | promoted | deprecated | retired
  previous_version: ""
  new_version: ""
  content_hash: ""
  source_ref: ""
  actor:
    type: human | governed_agent | import
    id: ""
  evidence_receipt_id: ""
  occurred_at: ""
```

## 5. Marketplace plane data model

### Publisher

```yaml
publisher:
  id: PUB-###
  type: first_party | verified_third_party
  verification_state: ""
  trust_tier: new | verified | established | enterprise | first_party
  payout_state: ""
  policy_acceptance_version: ""
```

Initial publisher: `PUB-001`, Full Stack Assets, `FIRST_PARTY`.

### Product

`Product` is deliberately separate from Canon entities.

```yaml
product:
  id: PRD-###
  publisher_id: PUB-###
  type: skill | agent | workflow_pack | collection
  slug: ""
  canonical_refs: []
  visibility: private | unlisted | public
  commercial_status: draft | active | suspended | retired
```

One canonical Skill may participate in several commercial products without being forked.

### ProductVersion

An immutable commercial snapshot:

```yaml
product_version:
  id: PRDV-###
  product_id: PRD-###
  version: 1.0.0
  canonical_snapshot:
    refs: []
    hashes: []
    canon_versions: []
  compatibility: []
  dependencies: []
  evaluation_record_ids: []
  changelog: ""
  publication_state: draft
  created_from_event: ""
```

### ProductComponent

Records component canonical ID/type, required/optional status, minimum compatible version, dependency order, reason for inclusion, license inheritance rule, and runtime requirements.

### RuntimeDistribution

```yaml
distribution:
  product_version_id: PRDV-###
  runtime: universal | chatgpt | cursor | gemini | grok | manus | mcp
  adapter_version: ""
  artifact_hash: ""
  package_location: ""
  compatibility_state: verified | experimental | unavailable | blocked | deprecated
  test_receipt_id: ""
```

### EvaluationRecord

Stores fixture set, runtime, rubric/score, policy failures, provenance completeness, compatibility result, evaluator identity, EvidenceReceipt, and timestamp.

### PublicationRecord

```yaml
publication:
  id: PUBREC-###
  product_id: PRD-###
  product_version_id: PRDV-###
  canonical_refs: []
  decision:
    method: auto | human
    policy_version: ""
    reviewer_id: ""
  validation:
    evaluation_records: []
    provenance_complete: true
    rights_status: ""
    compatibility_verified: []
  published_at: ""
```

### Offers and licenses

Offer classes:

```text
FREE
ONE_TIME
MONTHLY
ANNUAL
TEAM
ENTERPRISE
CUSTOM
```

License classes:

```text
FREE_PERSONAL
FREE_COMMERCIAL
PERPETUAL_PERSONAL
PERPETUAL_COMMERCIAL
SUBSCRIPTION
TEAM
ENTERPRISE
CUSTOM
```

License policies may govern users/seats, organization use, modification, redistribution, derivative products, resale, runtime deployment, included updates, support, and audit rights. Payment-provider identifiers never substitute for entitlement state.

## 6. Customer plane

Entities: User, Organization, Membership, Purchase, Subscription, Entitlement, Installation, Collection, CollectionItem, Review, UpdatePreference, and UpdateState.

Marketplace application permissions are separate from Agent RoleDefinitions:

```text
CUSTOMER
ORG_MEMBER
ORG_ADMIN
PUBLISHER_MEMBER
PUBLISHER_ADMIN
REVIEWER
MARKETPLACE_ADMIN
```

Entitlement example:

```yaml
entitlement:
  id: ENT-###
  subject:
    type: user | organization
    id: ""
  product_id: PRD-###
  license_policy_id: LIC-###
  acquired_version: ""
  version_policy: exact | patch_pinned | minor_pinned | major_pinned | current_while_active
  starts_at: ""
  expires_at: null
  status: active | suspended | expired | revoked
```

Entitlement resolves whether a user/organization may access a ProductVersion or RuntimeDistribution.

## 7. Persistence architecture

Five logically distinct persistence areas:

1. **Canon Registry** — authoritative canonical source, physically outside marketplace ownership and consumed through the Canon Registry Adapter contract.
2. **Marketplace relational database** — Publishers, Products, ProductVersions, ProductComponents, RuntimeDistributions, PublicationRecords, EvaluationRecords, Offers, LicensePolicies, OutboxEvents.
3. **Customer relational schema** — Users, Organizations, Memberships, Purchases, Subscriptions, Entitlements, Installations, Collections, Reviews, update preferences.
4. **Artifact store** — universal/runtime packages, evaluation artifacts, documentation bundles, previews, provenance receipts. Each artifact records ID, SHA-256, bytes, MIME type, ProductVersion, runtime, build ID, and provenance receipt.
5. **Append-only audit/event store** — Canon projections, validations, publication decisions, entitlement changes, installs, payment adapter events, security events, and publisher/admin actions.

## 8. Sync and projection pipeline

Registry Projector:

```text
Canon snapshot/event
    ↓
schema validation
    ↓
relationship resolution
    ↓
change classification
    ↓
commercial candidate generation
    ↓
ProductVersion draft
```

The projector writes only to marketplace projection state.

### Change classification

Patch: nonfunctional documentation/copy/metadata corrections; regression validation required.

Minor: optional inputs/outputs, improved rules, additional compatible runtime; evaluation and compatibility refresh required.

Major: new data class, integration, action type, changed authority/safety boundary, breaking schema, or material commercial behavior; full impact/access/evaluation review required.

### Outbox pattern

Important state transitions atomically write domain state and an outbox event. Workers consume events idempotently, preventing partial states such as “published in database but package missing.”

Projection identity uses canonical entity ID, canonical version, content hash, and event ID. Duplicate processing is a no-op. Out-of-order events preserve history but never move public active pointers backward.

## 9. Publication policy

ProductVersion lifecycle:

```text
DRAFT
VALIDATING
EVALUATING
COMMERCIAL_READY
PUBLICATION_REVIEW
PUBLISHED
SUPERSEDED
RETIRED
```

Failure/suspension states:

```text
BLOCKED_SCHEMA
BLOCKED_DEPENDENCY
BLOCKED_EVALUATION
BLOCKED_RIGHTS
BLOCKED_POLICY
BLOCKED_RUNTIME
SUSPENDED
SECURITY_BLOCKED
```

### Auto-publication eligibility

All required:

- Low risk
- free or unchanged already-approved commercial terms
- no new integration authority
- no new data classification
- no new external-action capability
- evaluations pass
- provenance complete
- rights/license state known
- required runtime compatibility passes
- publisher eligible for auto-publication

### Human review required

Any of:

- paid product activation
- new price/license terms
- major version
- Moderate / High / Restricted risk
- new I3/I4 capability
- new external communication/action
- legal/financial/clinical/employment/privacy/access impact
- security-sensitive change
- uncertain rights
- provenance gap
- new third-party publisher
- policy exception

Published versions may become ACTIVE, DELISTED, SUSPENDED, SECURITY_BLOCKED, LEGAL_HOLD, or RETIRED. Availability may change without rewriting history.

## 10. Catalog generation and public delivery

Public marketplace remains statically deliverable:

```text
Marketplace DB
    ↓
Catalog Builder
    ↓
catalog.snapshot.json
search-index.json
taxonomy.json
product JSON
    ↓
static /library pages
```

Generated examples:

```text
/library/catalog.json
/library/search-index.json
/library/products/SKL-026.json
/library/products/ESP-02.json
/library/publishers/PUB-001.json
```

Stateful actions call APIs: sign in, acquire, purchase, subscribe, install, save collection, review, check entitlement, publisher submission/review, and publication approval.

Backend outage: serve the last-known-good catalog snapshot. Static build failure: retain prior deployed catalog.

## 11. Universal distribution

Every published commercial ProductVersion generates a provider-neutral package containing:

```text
manifest.json
README.md
LICENSE
CHANGELOG.md
canonical/
runtime/
evaluations/
docs/
provenance/
```

Runtime outputs may include ChatGPT, Cursor, Gemini, Grok, Manus, MCP/API, and universal ZIP.

Compatibility states are evidence-based: VERIFIED, EXPERIMENTAL, UNAVAILABLE, BLOCKED, DEPRECATED. A failure in one optional adapter does not block other valid distributions.

## 12. Search and discovery

Search indexes stable ID, title, mission, description, use cases, domain, operating class, capabilities, Skill IDs, Role IDs, workflow membership, publisher, runtime support, risk, evaluation state, and price/license.

Intent-aware search should resolve related objects. For example, “review my PR” should surface `ESP-03`, `SKL-027`, and the relevant engineering pack.

Authenticated search may add owned, installed, updates available, customer-runtime compatibility, and organization-license availability.

## 13. Collections and Packs

Official first-party Collections:

1. Engineering & AI
2. Research & Intelligence
3. Creative Media
4. Governance & Operations

Collections may derive membership from canonical metadata and curation rules. Manual curation may override ordering but must not duplicate canonical identity. Workflow Packs package multiple Skills/Agents around an outcome and may be independently licensed.

## 14. Monetization architecture

Product ladder:

```text
Free discovery
→ Free Skills
→ Paid Skills
→ Paid Agents
→ Workflow Packs
→ Collections
→ Team / Organization Library
→ Private Enterprise Registry
```

Initial commercial shelf:

**Free foundation:** SKL-006, SKL-007, SKL-013, SKL-015, SKL-045.  
**Paid technical Skills:** SKL-026, SKL-027, SKL-028, SKL-030, SKL-032.  
**Flagship Agents:** ESP-01, ESP-02, ESP-03, DAA-07, GKE-06.  
**Flagship Packs:** Autonomous Engineering Pack, Deep Research Pack, AI Evaluation Pack.  
**Premium Collection:** Engineering & AI Library.

Prices are controlled by Offers and are not canonical fields.

Enterprise extension: private Skill/Agent library, private workflows, policy overlays, approved runtime adapters, private integrations, governance/evaluation, internal Publisher Studio, and organization-specific Canon extensions.

## 15. Curated third-party ecosystem

Launch first-party only, while making Publisher first-class from day one.

Third-party sequence:

```text
application
→ identity verification
→ policy agreement
→ sandbox publisher
→ submission
→ security/provenance review
→ evaluation
→ marketplace review
→ verified publisher
```

Trust tier may reduce routine review friction but never waive high-risk publication gates. Revenue share is configurable and not hard-coded.

## 16. Security and validation

Every ProductVersion passes:

```text
Schema Validation
→ Dependency Validation
→ Policy / Risk Validation
→ Runtime Evaluation
→ Commercial Publication Gate
```

Package security checks include secret detection, excessive permissions, unexpected executables, dependency tampering, path traversal, hidden external endpoints, malicious tool instructions, privilege escalation, and unapproved data access.

Agent-specific security checks include prompt injection, tool misuse, secret exfiltration, cross-user leakage, privilege escalation, unsafe autonomous action, policy bypass, and instruction hierarchy conflicts.

Authorization tests must prove:

- customer cannot edit publisher state
- publisher A cannot access publisher B private drafts
- customer cannot access unowned paid artifacts
- Publisher Studio cannot mutate Canon directly
- marketplace admin cannot bypass canonical I4 boundaries
- expired/revoked entitlements deny access
- public users cannot access private evaluation/security records

Trust states: SPECIFIED, TESTED, VERIFIED, PILOTED, PRODUCTION_PROVEN. Every badge maps to evidence.

## 17. Failure handling and rollback

Fail closed on invalid canonical schema, missing dependencies, failed evaluation, unknown rights/provenance, unauthorized integration scope, incompatible required runtime, and permission/authentication failure.

Required behavior:

- preserve previous published version
- record evidence/audit event
- surface actionable blocked state
- never bypass authentication or approval
- never silently downgrade risk

Rollback moves the active pointer to a prior published ProductVersion; it does not mutate history.

## 18. Observability

Operational metrics:

- Canon events received
- projection success rate and latency
- validation failures
- publication queue age
- auto-publish count
- human-review count
- runtime build failures
- catalog build failures
- entitlement errors
- rollback count

Commercial analytics:

- catalog/detail views
- search terms
- preview-to-acquire
- free-to-paid conversion
- install rate
- runtime distribution
- update adoption
- pack/collection attach
- churn/refunds
- organization expansion
- publisher revenue

Quality analytics remain distinct from revenue analytics.

## 19. Build decomposition

### Unit 1 — Canon Registry Adapter
Owns canonical ingestion, stable IDs, hashes, relationships, change detection, and Canon events. Does not own commerce/customer state.

### Unit 2 — Marketplace Core
Owns marketplace schema, projector, version state machine, publication engine, outbox/events, and immutable PublicationRecords.

### Unit 3 — Public Library
Owns `/library`, browsing, search, filters, generated pages, compatibility/evaluation views, SEO, and sitemap.

### Unit 4 — Customer Library
Owns authentication, entitlements, downloads, installs, updates, collections, and organization membership.

### Unit 5 — Publisher Studio
Owns commercial candidates, offers, evaluation/build status, previews, publication workflow, and analytics.

### Unit 6 — Commerce & Production Hardening
Owns payment adapter, subscriptions, perpetual purchases, refunds/revocations, artifact authorization, security alerts, backups, monitoring, and launch gates.

## 20. MVP definition of done

### Test A — Automatic creation

Create a valid new canonical Skill such as `SKL-046`.

Expected:
1. Canon detects it.
2. Event emitted.
3. Projector creates marketplace candidate.
4. ProductVersion generated.
5. Validation runs.
6. Search document generated.
7. Publication policy executes.
8. New Library volume appears without manual page creation.
9. Detail page works.
10. Provenance links to originating Canon record.

### Test B — Update

`SKL-046@1.0.0 → 1.1.0` must leave 1.0.0 immutable, create 1.1.0 as a new draft/update, record changelog, rerun required evaluations, expose update state, and avoid silent mutation.

### Test C — Invalid dependency

Expected state: `BLOCKED_DEPENDENCY`. Previous public version remains available.

### Test D — Consequential capability

Adding I4/high-risk behavior may project into a candidate, but automatic consequential publication/execution is prohibited. A human review packet is created and publication remains gated.

### Test E — Purchase

Expected chain: payment event → verified payment adapter → entitlement → My Library → authorized artifact → audit record.

### Test F — Runtime incompatibility

If ChatGPT passes and Gemini fails, marketplace truth must show ChatGPT `VERIFIED` and Gemini `BLOCKED`. No universal compatibility claim is permitted.

## 21. MVP non-goals

Deferred beyond the first production milestone:

- open self-service third-party publishing
- social feeds/followers
- affiliate program
- auction/bid placement
- public comments
- usage-token marketplace
- complex ML recommendation service
- arbitrary customer code execution
- autonomous financial payouts
- blockchain licensing
- custom runtime hosting
- full enterprise SSO
- multiple payment-provider integrations

## 22. Launch sequence

**Phase 0 — Internal Library:** validate Canon sync, product generation, search, Publisher Studio, and builds.  
**Phase 1 — Public Reference Library:** expose catalog, search, detail pages, evidence, compatibility, taxonomy.  
**Phase 2 — Free Distribution:** enable accounts, My Library, entitlements, installs, downloads, updates.  
**Phase 3 — Paid First-Party Marketplace:** enable checkout, perpetual licenses, subscriptions, Packs, Collections.  
**Phase 4 — Team / Enterprise:** enable organizations, shared libraries, policy controls, private products.  
**Phase 5 — Curated External Publishers:** enable applications, submissions, review, payouts, revenue sharing.

## 23. Product positioning

Primary positioning:

> **A governed library of portable, tested AI capabilities.**

Supporting positioning:

> **Build your AI workforce from verified components.**

The commercial moat is composability, evidence, portability, versioning, governance, explicit authority boundaries, runtime compatibility, professional packaging, and reliable update semantics.

## 24. Final constitutional contract

> **Canon defines capabilities. Marketplace packages and commercializes them. Runtime adapters distribute them. Customers receive entitlements to immutable versions. Evidence determines trust. Human Authority governs consequential actions.**

This contract is normative. Any implementation choice that conflicts with it is an architectural defect, not a local optimization.

## 25. Source basis

This design must remain consistent with:

- `00_LIBRARY_ARCHITECTURE.md`
- `01_CREATIVE_MEDIA_ROLE_CATALOG.md`
- `02_CROSS_INDUSTRY_ROLE_CATALOG.md`
- `03_SKILL_AND_INTEGRATION_CATALOG.md`
- `Extended Sector Role Catalog.md`
- `ROLE_SPEC_TEMPLATE.md`
- `SKILL_SPEC_TEMPLATE.md`
- `INTEGRATION_SPEC_TEMPLATE.md`

The repaired canonical inventory and stable IDs remain the operational source of truth where older source-document counts or wording have been superseded.