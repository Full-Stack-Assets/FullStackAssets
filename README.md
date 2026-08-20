# FullStackAssets

## Agentic Capability Library marketplace

The marketplace is a Canon-backed, provider-neutral Agent/Skill Library. Canon remains authoritative; marketplace records, commercial state, runtime adapters, customer entitlements, and enterprise policy are downstream and cannot expand canonical authority.

## Current release status

### Production: Units 1–3

Units 1–3 are merged to `main` and form the public static release:

1. **Canon Registry Adapter** — deterministic stable-ID ingestion, hashes, relationships, append-only events, and fail-closed last-known-good behavior.
2. **Marketplace Core** — `REFERENCE_ONLY` Product/ProductVersion projection, immutable version semantics, publication policy, and public-reference allowlisting.
3. **Public Library** — deterministic catalog materialization, search/detail pages, automatic Canon-to-volume generation, and GitHub Pages integration.

The canonical production URL is:

`https://fullstackassets.com/library/`

`Full-Stack-Assets/Full-Stack-Assets.github.io` is the canonical apex Pages host. Its workflow checks out this repository at `main`, validates and materializes the Canon-derived catalog, generates the Library, verifies the assembled source and deployment artifact, preserves the existing Aetheria/BuildGraph routes, and deploys the verified artifact to `fullstackassets.com`.

### Implementation-verified, not production-deployed: Units 4–8

Units 4–8 are preserved as stacked implementation-review branches/PRs and have passed the complete inherited verification stack, but they are deliberately not represented as live production services:

4. **Customer Library** — OIDC identity, app roles, organization isolation, entitlements, immutable artifact authorization, installations, collections, and update state.
5. **Publisher Studio** — commercial candidates, evaluations/builds, Offers, payload-bound publication review, Human Authority approval, and Canon-change proposals.
6. **Commerce & Production Hardening** — Stripe adapter boundary, signed/idempotent payment events, entitlement lifecycle, package scanning, immutable artifact receipts, recovery, telemetry, and release gates.
7. **Runtime Distribution** — provider-neutral universal/runtime packages and evidence-derived compatibility for supported runtimes without authority escalation.
8. **Enterprise Governance** — private registries, restriction-only enterprise policy, curated publisher verification, revenue-share policy contracts, and final launch-evidence validation.

The corrected Unit 8 tree passed Marketplace Enterprise, Distribution, Release, Publisher, Customer, Library, Core, Canon, and Platform neutrality workflows. That evidence verifies implementation behavior, not live provider deployment.

## Production API decision gate

Dynamic Units 4–8 cannot be called production-deployed until the existing Human Authority decision gate is resolved. The repository does **not** select a compute/runtime provider by default, and no substitute provider should be introduced merely to close a deployment checklist.

Production API deployment requires a separately approved provider adapter and credentials, plus verified production configuration for:

- Node.js 22 compute/runtime;
- PostgreSQL migrations, readiness, backup, and restore;
- OIDC issuer, audience, JWKS, origins/redirects, and app-role mapping;
- S3-compatible immutable artifact storage and signed reads;
- API origin, TLS, CORS, and browser authentication behavior;
- Stripe production credentials/webhook configuration only if paid launch is separately approved.

See `docs/runbooks/marketplace-release.md` for the evidence required to clear this gate.

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

Run the released static stack with:

```bash
node --test \
  tests/*.test.mjs \
  tests/marketplace/canon/*.test.mjs \
  tests/marketplace/core/*.test.mjs \
  tests/marketplace/catalog/*.test.mjs
```

The complete eight-unit implementation plan index and individual plans live under `docs/superpowers/plans/`; the frozen design lives under `docs/superpowers/specs/`.
