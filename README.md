# FullStackAssets

## Agentic Capability Library marketplace

The marketplace implementation is built as a stacked branch series. The public site remains a static GitHub Pages property; marketplace code is a downstream projection of the Agentic AI Role Library and must never mutate Canon.

### Unit 1: Canon Registry Adapter

Run the Unit 1 tests with:

```bash
node --test tests/marketplace/canon/*.test.mjs
```

Import an explicit canonical export with:

```bash
node marketplace/bin/import-canon.mjs --source /path/to/export --out data/library
```

The export directory must contain `roles.csv`, `skills.csv`, `integrations.csv`, `overlays.csv`, and `relationships.csv`. Successful imports write deterministic snapshots/checksums plus append-only change events. Validation failures are fail-closed and preserve the last-known-good snapshot.

### Unit 2: Marketplace Core

Run Unit 2 domain tests with:

```bash
node --test tests/marketplace/core/*.test.mjs
```

Unit 2 projects Canon events into private `REFERENCE_ONLY` Products and immutable draft ProductVersions. It defines the marketplace relational schema, transactional repository contract, projection receipts/outbox events, semantic change severity, publication state machine, Human Authority publication policy, and allowlist-based public reference projection.

### Unit 3: Public Library

The public Library is generated from a derived, hash-verified marketplace catalog mirror. The checked-in baseline contains the eligible Canon reference inventory as `REFERENCE_ONLY`; it is not an editable source of truth and does not make items installable or purchasable.

Materialize the derived catalog baseline and build the static Library with:

```bash
node marketplace/bin/materialize-catalog.mjs \
  --parts data/library/catalog-baseline \
  --meta data/library/catalog-baseline.json \
  --out data/library/catalog.snapshot.json
node marketplace/bin/build-library.mjs \
  --catalog data/library/catalog.snapshot.json \
  --out library
```

The Pages workflow injects the `/library/` discovery link and sitemap root into the deployment workspace, re-runs static-site verification, and then packages the site. The source portfolio remains person-first and its three featured projects remain unchanged.

### Unit 4: Customer Library

Unit 4 adds the provider-neutral persistent API contract: PostgreSQL repository adapters, OIDC/JWT identity verification, application and organization authorization, entitlement resolution, immutable artifact access, installations, collections, version/update state, and the `/my-library/` static shell. Entitlement determines commercial artifact access; authentication never grants canonical Agent authority.

### Unit 5: Publisher Studio

Unit 5 adds first-party publisher workflows for commercial candidates, evidence-derived trust, evaluations, runtime builds, Offers and LicensePolicies, payload-bound publication review, and Canon change proposals. Publisher Studio cannot directly mutate Canon, and paid/material publication remains Human-Authority-gated.

### Unit 6: Commerce & Production Hardening

Unit 6 adds Stripe as the first payment adapter, idempotent verified payment-event fulfillment, entitlement lifecycle/refund semantics, package security scanning, immutable artifact receipts, an S3-compatible artifact adapter contract, backup/recovery controls, observability, and the ten release gates. The accepted paid-flow proof is test-mode and creates no production payment side effects.

### Unit 7: Runtime Distribution

Unit 7 adds the provider-neutral universal-package and runtime-distribution factory for ChatGPT, Cursor, Gemini, Grok, Manus, and MCP/API. Compatibility is evidence-backed per runtime and adapter version. Unsupported runtimes remain `UNAVAILABLE`, and adapters cannot add permissions, integrations, data classes, or authority beyond Canon.

### Unit 8: Enterprise Governance

Unit 8 adds organization-private registries, monotonic enterprise policy overlays, curated publisher verification, approved revenue-share configuration, enterprise isolation, and the final launch-evidence verifier. Private registries reference marketplace ProductVersions rather than forking Canon; enterprise policy may narrow authority but never expand it.

## Full verification

Run the complete Unit 1–8 repository suite with explicit test directories:

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
  tests/marketplace/release/*.test.mjs \
  tests/marketplace/enterprise/*.test.mjs \
  tests/marketplace/launch/*.test.mjs
```

Release and launch evidence are additionally checked with:

```bash
node marketplace/bin/verify-marketplace-release.mjs --fixture tests/fixtures/release/pass.json
node marketplace/bin/verify-marketplace-launch.mjs --fixture tests/fixtures/launch/pass.json
```

## Production deployment boundary

GitHub Pages is the approved public static deployment for the Library and can be released independently after its source/build acceptance tests pass. The dynamic marketplace API is deliberately a separate deployment concern.

**API production deployment is an explicit decision gate.** The repository defines provider-neutral interfaces and required dependencies, but it does not select a compute/runtime provider. Before Units 4–8 can be described as live production services, Human Authority must approve the production runtime/provider adapter and the deployment must supply and verify PostgreSQL, OIDC, S3-compatible artifact storage, public API origin/TLS/CORS configuration, and Stripe production configuration only if paid launch is activated.

Do not substitute a new hosting architecture merely to close this gate. See `docs/runbooks/marketplace-release.md` for the deployment and evidence contract.

Design and implementation plans live under `docs/superpowers/specs/` and `docs/superpowers/plans/`.